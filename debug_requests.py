import requests
import numpy as np
import scipy.io.wavfile as wav
import io

# 1. Create a dummy WAV file in memory
sr = 22050
t = np.linspace(0, 1.0, int(sr * 1.0))
y = 0.5 * np.sin(2 * np.pi * 440 * t)
y = (y * 32767).astype(np.int16)

byte_io = io.BytesIO()
wav.write(byte_io, sr, y)
byte_io.seek(0)

# 2. Send POST request to backend
url = "http://127.0.0.1:8000/analyze"
files = {
    'reference': ('ref.wav', byte_io, 'audio/wav'),
    'user': ('user.wav', byte_io, 'audio/wav')
}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
