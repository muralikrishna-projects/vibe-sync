import numpy as np
from fastdtw import fastdtw
import matplotlib.pyplot as plt

def compute_sim(norm_ref, norm_user):
    distance, path = fastdtw(norm_ref, norm_user, dist=lambda x, y: abs(x - y))
    normalized_distance = distance / len(path)
    return 100 * np.exp(-3.0 * normalized_distance)

# Random noise normalized (mimicking pyin hallucination)
f0_ref = np.sin(np.linspace(0, 10, 200)) # smooth reference curve
f0_user = np.random.randn(200) # random noise

print("DTW distance between smooth curve and noise:", compute_sim(f0_ref, f0_user))

def compute_dynamics(rms_ref, rms_user):
    distance, path = fastdtw(rms_ref, rms_user, dist=lambda x, y: abs(x - y))
    return 100 * np.exp(-2.0 * distance / len(path))

rms_ref = np.abs(np.sin(np.linspace(0, 10, 200)))
rms_user = np.random.rand(200) # random amplitude

print("DTW dynamics distance between smooth and noise:", compute_dynamics(rms_ref, rms_user))
