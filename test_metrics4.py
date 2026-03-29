import numpy as np

rhythm_score = 13.0
dynamics_score = 66.0
intonation_score = 74.0

# Rhythm penalty
penalty = (rhythm_score / 100.0) ** 0.5  # sqrt(0.13) = 0.36
new_dyn = dynamics_score * penalty
new_int = intonation_score * penalty

print(f"Penalized Dynamics: {new_dyn:.2f}")
print(f"Penalized Intonation: {new_int:.2f}")

# Stricter Rhythm penalty?
penalty_strict = (rhythm_score / 100.0)  # linear decay
print(f"Strict Penalized Dynamics: {dynamics_score * penalty_strict:.2f}")
print(f"Strict Penalized Intonation: {intonation_score * penalty_strict:.2f}")
