import numpy as np
from fastdtw import fastdtw
import matplotlib.pyplot as plt

def compute_sim(norm_ref, norm_user):
    distance, path = fastdtw(norm_ref, norm_user, dist=lambda x, y: abs(x - y))
    normalized_distance = distance / len(path)
    return 100 * np.exp(-3.0 * normalized_distance)

# Simulate reference pitch (some voice, some silence)
f0_ref = np.zeros(100)
f0_ref[20:80] = np.sin(np.linspace(0, 3, 60)) * 50 + 200

# Simulate noise pitch (all mostly 0, few random spikes)
f0_user = np.zeros(100)
f0_user[40:45] = 180

def normalize_pitch(f0):
    non_zero = f0[f0 > 0]
    if len(non_zero) == 0: return f0
    mean = np.mean(non_zero)
    std = np.std(non_zero)
    if std == 0: return f0
    # Clip outliers to 3 sigma for stability
    norm = (f0 - mean) / std
    return np.clip(norm, -3, 3)

# Test old logic
old_norm_ref = normalize_pitch(f0_ref.copy())
old_norm_user = normalize_pitch(f0_user.copy())

print("Old logic score:", compute_sim(old_norm_ref, old_norm_user))

# Test new logic (only normalize >0, leave 0 as -10 or penalize voice mismatch)
def new_normalize(f0):
    res = np.zeros_like(f0)
    non_zero = f0[f0 > 0]
    if len(non_zero) == 0: 
        return np.full_like(f0, -100) # Highly penalize
    mean = np.mean(non_zero)
    std = np.std(non_zero)
    if std == 0: std = 1
    
    # map voiced frames to their normalized pitch
    res[f0 > 0] = (f0[f0 > 0] - mean) / std + 5 # shift up so it doesn't overlap with unvoiced
    # map unvoiced frames to 0
    res[f0 == 0] = 0
    return res

new_norm_ref = new_normalize(f0_ref.copy())
new_norm_user = new_normalize(f0_user.copy())
print("New logic score:", compute_sim(new_norm_ref, new_norm_user))

