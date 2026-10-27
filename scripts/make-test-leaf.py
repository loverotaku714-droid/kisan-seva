import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Draw a simple leaf with yellow/brown spots (leaf-fungus lookalike) for vision test
fig, ax = plt.subplots(figsize=(4, 4), constrained_layout=True)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

# leaf shape (green ellipse-ish)
leaf = patches.Ellipse((5, 5), 6, 8, angle=30, color='#2e7d32')
ax.add_patch(leaf)
# stem
ax.plot([5, 5], [0.5, 2.2], color='#5d4037', lw=4)
# midrib
ax.plot([4.2, 5.8], [1.8, 8.2], color='#1b5e20', lw=2)

rng = np.random.default_rng(7)
# yellow/brown disease spots
for _ in range(14):
    x = rng.uniform(3, 7)
    y = rng.uniform(2, 8)
    r = rng.uniform(0.15, 0.45)
    spot = patches.Circle((x, y), r, color='#f9a825' if rng.random() > 0.5 else '#8d6e63')
    ax.add_patch(spot)

fig.savefig('/home/z/my-project/scripts/test-leaf.png', dpi=90, facecolor='#f5f5dc')
print('saved')
