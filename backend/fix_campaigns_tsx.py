#!/usr/bin/env python3
"""Fix remaining sbs reference in CampaignsTab.tsx."""
path = "../frontend/src/pages/CampaignsTab.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all remaining 'sbs.' with 'sb.'
content = content.replace('sbs.', 'sb.')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed remaining sbs references -> sb")
