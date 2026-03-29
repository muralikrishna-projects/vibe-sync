import librosa
import numpy as np
from scipy.spatial.distance import cosine
from scipy.signal import correlate
from scipy.stats import pearsonr
from fastdtw import fastdtw
import warnings
import traceback

# Suppress librosa warnings for cleaner logs
warnings.filterwarnings("ignore")

def sync_audio(y_ref, y_user, sr):
    """
    Synchronizes y_user within y_ref using Chroma Cross-Correlation.
    Returns the cropped segment of y_ref that matches y_user.
    """
    # If reference is shorter than user, we can't really "find" user inside reference.
    # We'll just compare what we have (this is rare if ref is a full song).
    if len(y_ref) < len(y_user):
        warnings.warn("Reference audio is shorter than user recording. Alignment validation skipped.")
        return y_ref

    # 1. Extract Chroma Features (Energy distribution across 12 pitch classes)
    # Hop length 512 is standard. Optimized: Use chroma_stft instead of chroma_cqt for massive memory savings.
    chroma_ref = librosa.feature.chroma_stft(y=y_ref, sr=sr, hop_length=512)
    chroma_user = librosa.feature.chroma_stft(y=y_user, sr=sr, hop_length=512)

    # 2. Cross-Correlate to find time offset
    # Optimized: Cross-correlate the average chroma energy profiles
    chroma_ref_avg = np.mean(chroma_ref, axis=0)
    chroma_user_avg = np.mean(chroma_user, axis=0)
    
    # Normalize (Zero mean, Unit variance)
    chroma_ref_avg -= np.mean(chroma_ref_avg)
    chroma_user_avg -= np.mean(chroma_user_avg)
    
    std_ref = np.std(chroma_ref_avg)
    std_user = np.std(chroma_user_avg)
    
    if std_ref > 0: chroma_ref_avg /= std_ref
    if std_user > 0: chroma_user_avg /= std_user
    
    # Use 'valid' mode: essentially sliding the shorter 'user' window over 'ref'
    correlation = correlate(chroma_ref_avg, chroma_user_avg, mode='valid')
    time_delay_frames = np.argmax(correlation)
    
    # Convert frames to samples
    time_offset_samples = time_delay_frames * 512
    
    # Crop Reference with a Buffer
    # If the user performed slower, they cover less content in the same time? No.
    # If user sings SLOWER: 
    #   User: "He...llo..." (Duration 5s)
    #   Ref: "Hello" (Duration 3s)
    #   We have 5s of User. We need 5s of Ref?
    #   If we crop 5s of Ref starting at "Hello", we get "Hello" + 2s of silence/next line.
    #   This is correct! DTW will stretch "He...llo..." to match "Hello" + next bit? 
    #   Actually DTW will match "He...llo..." to "Hello". The extra 2s of Ref will be matched to end of User?
    #
    # If user sings FASTER:
    #   User: "Hello" (Duration 2s)
    #   Ref: "He...llo..." (Duration 5s)
    #   We have 2s of User.
    #   If we crop 2s of Ref, we get "He...ll". 'o...' is cut off!
    #   DTW will match "Hello" (User) to "He...ll" (Ref). The 'o' is missing.
    #   So we need to crop MORE of the Reference if the user is faster.
    #
    # Conclusion: Since we don't know the tempo difference yet, we should crop a bit MORE of the reference 
    # to account for potential "Faster" singing (where Ref content is spread out over more time than User takes).
    #
    # Buffer: Add 20% to the crop length.
    
    buffer_samples = int(len(y_user) * 0.2) 
    end_sample = time_offset_samples + len(y_user) + buffer_samples
    
    y_ref_aligned = y_ref[time_offset_samples : end_sample]
    
    # Safety Check: If crop failed or is empty
    if len(y_ref_aligned) == 0:
        print("Warning: Aligned reference is empty. Fallback to original.")
        return y_ref if len(y_ref) > 0 else y_user # desperate fallback

    # Verify length (pad if shorter than user)
    # Even though DTW handles dynamic lengths, having it at least as long as User 
    # (or close to it) prevents edge cases where we matched the very end of silence.
    if len(y_ref_aligned) < len(y_user):
        padding = len(y_user) - len(y_ref_aligned)
        y_ref_aligned = np.pad(y_ref_aligned, (0, padding))
        
    return y_ref_aligned

def analyze_audio_files(ref_path: str, user_path: str):
    """
    Analyzes two audio files for Spectral Fidelity and Intonation Accuracy.
    """
    try:
        import gc
        # Load Audio Files
        # Optimize: Reduce SR to 16kHz (Standard for speech/singing analysis)
        # Prevent OOM: Strictly limit duration to 45s for 512MB RAM instances
        print("Loading audio files...", flush=True)
        y_ref_full, sr_ref = librosa.load(ref_path, sr=16000, duration=45.0)
        y_user, sr_user = librosa.load(user_path, sr=16000, duration=45.0)

        # ---------------------------
        # Pre-processing: Source Separation
        # ---------------------------
        # Process sequentially and GC immediately to save memory footprint
        print("Separating Vocals/Harmonics from Reference Beats...", flush=True)
        y_ref, _ = librosa.effects.hpss(y_ref_full)
        del y_ref_full
        gc.collect()
        
        print("Separating Vocals/Harmonics from User Beats...", flush=True)
        y_user, _ = librosa.effects.hpss(y_user)
        gc.collect()

        # ---------------------------
        # 0. Sync / Alignment
        # ---------------------------
        print(f"Original Lengths: Ref={len(y_ref)}, User={len(y_user)}", flush=True)
        print("Starting Alignment...", flush=True)
        y_ref_aligned = sync_audio(y_ref, y_user, sr_ref)
        y_ref = y_ref_aligned # Replace with aligned version
        print(f"Aligned Lengths: Ref={len(y_ref)}, User={len(y_user)}", flush=True)
        del y_ref_aligned
        gc.collect()

        # ---------------------------
        # 1. Dynamics Match (Replaces Spectral Fidelity)
        # ---------------------------
        print("Calculating Dynamics...", flush=True)
        # Measure volume/energy envelope matching
        # Optimize: Increase hop_length for faster computation
        rms_ref = librosa.feature.rms(y=y_ref, hop_length=1024)[0]
        rms_user = librosa.feature.rms(y=y_user, hop_length=1024)[0]
        
        # Normalize RMS (0 to 1)
        if np.max(rms_ref) > 0: rms_ref /= np.max(rms_ref)
        if np.max(rms_user) > 0: rms_user /= np.max(rms_user)
        
        # Align RMS curves using DTW
        print("Running DTW for Dynamics...", flush=True)
        dist_rms, path_rms = fastdtw(rms_ref, rms_user, dist=lambda x, y: abs(x - y))
        norm_dist_rms = dist_rms / len(path_rms)
        
        # Pearson Correlation for Structural Dynamics (Strictness)
        # Extracts aligned sequences dynamically from path
        aligned_rms_ref = np.array([rms_ref[i] for i, j in path_rms])
        aligned_rms_user = np.array([rms_user[j] for i, j in path_rms])
        # Add tiny epsilon to avoid constant-array division by zero warnings
        corr_rms, _ = pearsonr(aligned_rms_ref + 1e-10, aligned_rms_user + 1e-10)
        
        # Base Score from structural distance bounded by Pearson structural similarity scaling
        base_dynamics_score = 100 * np.exp(-2.0 * norm_dist_rms)
        dynamics_score = base_dynamics_score * max(0.0, float(corr_rms))

        # ---------------------------
        # 2. Intonation Accuracy (Strict) & Rhythm Precision
        # ---------------------------
        print("Extracting Pitch (pYIN)... this may take a moment...", flush=True)
        # Extract Pitch (F0)
        # Optimize: hop_length=1024 reduces validation frames by 2x compared to 512
        f0_ref, _, _ = librosa.pyin(y_ref, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=16000, hop_length=1024)
        f0_user, _, _ = librosa.pyin(y_user, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=16000, hop_length=1024)

        f0_ref = np.nan_to_num(f0_ref)
        f0_user = np.nan_to_num(f0_user)
        
        # Voice Activity Gating: Pure noise hallucinates ~0-5% pitched frames whereas singing is 40-70%+
        ref_voiced_frames = np.sum(f0_ref > 0)
        user_voiced_frames = np.sum(f0_user > 0)
        voice_ratio = user_voiced_frames / max(1, ref_voiced_frames)
        # Cap ratio at 1.0 (sometimes user sings more off-time, which is fine)
        voice_confidence = min(1.0, float(voice_ratio))

        def normalize_pitch(f0):
            non_zero = f0[f0 > 0]
            if len(non_zero) == 0: return f0
            mean = np.mean(non_zero)
            std = np.std(non_zero)
            if std == 0: return f0
            # Clip outliers to 3 sigma for stability
            norm = (f0 - mean) / std
            return np.clip(norm, -3, 3)

        norm_ref = normalize_pitch(f0_ref)
        norm_user = normalize_pitch(f0_user)

        # DTW for Pitch
        print("Running DTW for Pitch...", flush=True)
        distance, path = fastdtw(norm_ref, norm_user, dist=lambda x, y: abs(x - y))
        normalized_distance = distance / len(path)

        # Intonation Score: STRICTER (Decay 0.5 -> 3.0)
        # Small deviations should be penalized heavily now.
        base_intonation_score = 100 * np.exp(-3.0 * normalized_distance)
        
        # Punish hallucinated alignment for predominantly unvoiced (noise) inputs (square confidence)
        intonation_score = base_intonation_score * (voice_confidence ** 2)

        # ---------------------------
        # 3. Rhythm Precision (New)
        # ---------------------------
        print("Calculating Rhythm...", flush=True)
        # Calculated from the warp path of the Intonation alignment (or Dynamics alignment).
        # A perfect rhythm match means path is close to the diagonal.
        # Rushing/Dragging causes the path to deviate from (i, j) where i ~= j.
        
        # Calculate deviation area from diagonal
        # path is list of tuples (i, j)
        # We want to measure correlation or deviation.
        # Simple metric: Mean Absolute Deviation from diagonal i/N vs j/M
        path = np.array(path)
        i_s = path[:, 0]
        j_s = path[:, 1]
        
        # Scale indices to 0..1 to compare reference time vs user time
        i_norm = i_s / len(norm_ref)
        j_norm = j_s / len(norm_user)
        
        # Deviation = |RefTime - UserTime|
        rhythm_deviations = np.abs(i_norm - j_norm)
        mean_deviation = np.mean(rhythm_deviations)
        
        # Score: 0 dev -> 100. 0.1 dev (10% drift) -> ~60%
        # Strictness: High
        rhythm_score = 100 * np.exp(-5.0 * mean_deviation)

        # Rhythm Gating: Punishes algorithm alignment metrics if time-shifting (rhythm) was totally unstable/warped (like for noise)
        rhythm_gate = rhythm_score / 100.0
        gated_dynamics = dynamics_score * rhythm_gate
        gated_intonation = intonation_score * rhythm_gate

        # Paranoid casting
        d_score = float(gated_dynamics)
        i_score = float(gated_intonation)
        r_score = float(rhythm_score)
        
        if np.isnan(d_score): d_score = 0.0
        if np.isnan(i_score): i_score = 0.0
        if np.isnan(r_score): r_score = 0.0
        
        # Update return keys to match what frontend expects (based on previous reverted changes)
        # Frontend expects: rhythm_precision, dynamics_match, intonation_accuracy
        results = {
            "rhythm_precision": round(r_score, 2), # Replaces Phonetic
            "dynamics_match": round(d_score, 2),   # Replaces Spectral
            "intonation_accuracy": round(i_score, 2)
        }
        print(f"Analysis Complete: {results}", flush=True)
        return results

    except Exception as e:
        print(f"Error in analysis: {e}")
        import traceback
        traceback.print_exc()
        return {
            "mcd": 0.0,
            "pitch_drift": 0.0,
            "intonation_accuracy": 0.0
        }
