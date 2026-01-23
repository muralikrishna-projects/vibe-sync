# 🐍 VibeSync Backend

The powerful audio analysis engine behind **VibeSync**. Built with **FastAPI** and **Librosa**.

---

## ⚡ Key Capabilities

The backend is responsible for the heavy lifting of audio signal processing. It performs the following steps for every analysis request:

### 1. Source Separation (HPSS)
Musical tracks often contain drums and strong beats that confuse pitch-detection algorithms. 
We use **Harmonic-Percussive Source Separation (HPSS)** to split the audio signal into two components:
- **Harmonic**: Vocals, Guitar, Piano (Melody) -> **Kept for Analysis**
- **Percussive**: Drums, Claps, Noise -> **Discarded**

This ensures that we are comparing *your voice* to the *reference voice*, not your voice to a drum beat.

### 2. Audio Synchronization
Users rarely start recording at the exact millisecond the reference track starts.
- We use **Chroma Cross-Correlation** to find the time offset.
- The reference track is automatically cropped (and buffered) to match the user's start and end times.

### 3. Dynamic Time Warping (DTW)
Even if you start on time, you might sing slightly faster or slower than the original.
- **DTW** stretches and compresses the time axis to align your pitch curve with the reference curve perfectly.
- This allows us to score you on *pitch accuracy* even if your *timing* wasn't 100% perfect (and calculate a separate score for timing!).

---

## 🛠️ Installation

### Prerequisites
- Python 3.9 or higher
- Pip

### Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

> **Note**: On Windows, we use `soundfile` to ensure `librosa` can load audio without system-level ffmpeg installation.

---

## 🚀 Running the Server

```bash
python main.py
```
The server will start on `http://0.0.0.0:8000`.

### API Endpoints

#### `POST /analyze`
Accepts two files (`multipart/form-data`):
- `reference`: The original audio file (WAV/MP3).
- `user`: The user's performance audio file (WAV/MP3).

**Returns JSON:**
```json
{
  "rhythm_precision": 92.5,
  "dynamics_match": 88.0,
  "intonation_accuracy": 95.2
}
```

---

## 🔧 Environment Variables

Create a `.env` file in this directory to configure the server:

```env
# CORS Configuration
# Allow specific frontends (comma separated)
ALLOWED_ORIGINS=http://localhost:3000,https://myapp.vercel.app
```

---

## 📦 Dependencies

- **FastAPI**: High-performance web framework.
- **Librosa**: The gold standard for audio analysis in Python.
- **NumPy / SciPy**: fast mathematical operations.
- **FastDTW**: Optimized Dynamic Time Warping implementation.
- **Uvicorn**: ASGI server.

---

VibeSync Backend © 2026
