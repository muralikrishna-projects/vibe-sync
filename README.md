# 🎙️ VibeSync

### **AI-Powered Vocal Comparison & Training Tool**

![VibeSync Badge](https://img.shields.io/badge/VibeSync-AI%20Audio%20Analysis-indigo?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Python](https://img.shields.io/badge/Python-FastAPI-yellow?style=flat-square&logo=python)
![Tailwind](https://img.shields.io/badge/Style-Tailwind_CSS-38bdf8?style=flat-square&logo=tailwindcss)

---

## 🌟 Overview

**VibeSync** is a cutting-edge web application designed to help singers and voice professionals compare their performance against a reference track. Using advanced **Signal Processing** and **AI**, it analyzes your audio in real-time to provide feedback on:

- **🥁 Rhythm Precision**: How perfectly you stayed on beat.
- **🔊 Dynamics Match**: How well you matched the energy and volume swells.
- **🎵 Intonation Accuracy**: How precise your pitch was compared to the original.

> **Note**: VibeSync separates vocals from background music (drums/beats) using **Harmonic-Percussive Source Separation (HPSS)**, ensuring a fair comparison even if you record over a backing track!

---

## 🎨 Features

- **Split-Mode Input**: 
  - 🎤 **Live Recording**: Record directly in the browser with a beautiful real-time frequency visualizer.
  - 📂 **File Upload**: Upload existing performances for analysis.
- **Smart Analysis Engine**:
  - Automatically aligns your audio with the reference using **Chroma Cross-Correlation**.
  - Handles different tempos and dynamic lengths using **Dynamic Time Warping (DTW)**.
  - Filters out background noise and beats.
- **Visual Dashboard**:
  - Glassmorphic UI with smooth animations (Framer Motion).
  - Detailed score breakdown with actionable AI feedback.

---

## 🛠️ Tech Stack

### **Frontend (Client)**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Visuals**: Canvas API for audio frequency visualization

### **Backend (Server)**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Audio Processing**: [Librosa](https://librosa.org/) + NumPy + SciPy
- **Algorithms**: 
  - **HPSS** for source separation.
  - **FastDTW** for time alignment.
  - **pYIN** for pitch extraction.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)

### 1. Clone the Repository
```bash
git clone https://github.com/muralikrishna-projects/vibe-sync.git
cd vibe-sync
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env.local

# Run Development Server
npm run dev
```
The frontend will start at `http://localhost:3000`.

### 3. Backend Setup
Open a new terminal and navigate to the backend folder:
```bash
cd backend

# Create Virtual Environment (Optional but recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install Python Dependencies
pip install -r requirements.txt

# Setup Environment Variables
cp .env.example .env

# Run API Server
python main.py
```
The backend will start at `http://localhost:8000`.

---

## ⚙️ Configuration

### Frontend (`.env.local`)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | The URL of the Python Backend | `http://localhost:8000` |

### Backend (`backend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `*` (Allow All) |

---

## 🧠 How It Works

1.  **Upload**: You provide a **Reference Audio** (the original song).
2.  **Input**: You provide your **User Audio** (recording or upload).
3.  **Process**:
    *   The backend loads both files (resampled to 16kHz).
    *   **Source Separation**: It strips away drums/percussion using **HPSS**.
    *   **Alignment**: It finds the exact start time of your performance within the reference track.
    *   **Comparison**: It calculates similarity scores using DTW for pitch and energy curves.
4.  **Feedback**: You receive a score out of 100 for Rhythm, Dynamics, and Intonation.

---

## 🐳 Docker Deployment

Run the entire stack with a single command:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

> **Note on Custom Key Configuration**:
> The `NEXT_PUBLIC_API_URL` is baked into the frontend at **build time**.
> If you are deploying to a production server (not localhost), you must build with the correct URL:
> ```bash
> docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com -t vibe-sync .
> ```



---

## © Credits

Created by **A. Murali Krishna**  
© 2026 VibeSync. All rights reserved.
