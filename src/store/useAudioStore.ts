import { create } from 'zustand'

interface AudioState {
    referenceFile: File | null
    recordedBlob: Blob | null
    isRecording: boolean
    isAnalyzing: boolean
    transcriptReference: string
    transcriptUser: string
    // New Metrics
    rhythmPrecision: number
    timbreSimilarity: number
    pitchAccuracy: number
    errorMessage: string | null
    status: 'idle' | 'recording' | 'analyzing' | 'completed' | 'error'

    setReferenceFile: (file: File | null) => void
    setRecordedBlob: (blob: Blob | null) => void
    setIsRecording: (isRecording: boolean) => void
    setAnalysisResults: (rhythm: number, timbre: number, pitch: number) => void
    setTranscripts: (ref: string, user: string) => void
    setStatus: (status: AudioState['status']) => void
    setError: (error: string) => void
    resetUser: () => void
    reset: () => void
}

export const useAudioStore = create<AudioState>((set) => ({
    referenceFile: null,
    recordedBlob: null,
    isRecording: false,
    isAnalyzing: false,
    transcriptReference: '',
    transcriptUser: '',
    rhythmPrecision: 0,
    timbreSimilarity: 0,
    pitchAccuracy: 0,
    errorMessage: null,
    status: 'idle',

    setReferenceFile: (file) => set({ referenceFile: file }),
    setRecordedBlob: (blob) => set({ recordedBlob: blob }),
    setIsRecording: (isRecording) => set({ isRecording, status: isRecording ? 'recording' : 'idle' }),
    setAnalysisResults: (rhythm, timbre, pitch) => set({
        rhythmPrecision: rhythm,
        timbreSimilarity: timbre,
        pitchAccuracy: pitch
    }),
    setTranscripts: (ref, user) => set({ transcriptReference: ref, transcriptUser: user }),
    setStatus: (status) => set({ status, isAnalyzing: status === 'analyzing', errorMessage: status !== 'error' ? null : undefined }), // Clear error if not error status
    setError: (error) => set({ status: 'error', errorMessage: error }),
    resetUser: () => set({
        recordedBlob: null,
        isRecording: false,
        isAnalyzing: false,
        transcriptUser: '',
        rhythmPrecision: 0,
        timbreSimilarity: 0,
        pitchAccuracy: 0,
        errorMessage: null,
        status: 'idle'
    }),
    reset: () => set({
        referenceFile: null,
        recordedBlob: null,
        isRecording: false,
        isAnalyzing: false,
        transcriptReference: '',
        transcriptUser: '',
        rhythmPrecision: 0,
        timbreSimilarity: 0,
        pitchAccuracy: 0,
        errorMessage: null,
        status: 'idle'
    })
}))
