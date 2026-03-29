import numpy as np
from fastdtw import fastdtw
from scipy.stats import pearsonr

rms_ref = np.abs(np.sin(np.linspace(0, 10, 200)))
rms_user = np.random.rand(200) # random amplitude

distance, path = fastdtw(rms_ref, rms_user, dist=lambda x, y: abs(x - y))

# extract aligned arrays
aligned_ref = np.array([rms_ref[i] for i, j in path])
aligned_user = np.array([rms_user[j] for i, j in path])

corr, _ = pearsonr(aligned_ref, aligned_user)
score = max(0, corr) * 100
print("Dynamics Correlation Score (Noise):", score)

rms_user_good = np.abs(np.sin(np.linspace(0, 10, 200))) + np.random.rand(200)*0.1
distance, path = fastdtw(rms_ref, rms_user_good, dist=lambda x, y: abs(x - y))
aligned_ref = np.array([rms_ref[i] for i, j in path])
aligned_user = np.array([rms_user_good[j] for i, j in path])
corr, _ = pearsonr(aligned_ref, aligned_user)
score = max(0, corr) * 100
print("Dynamics Correlation Score (Good):", score)
