#!/usr/bin/env python3
"""Fix TypeScript errors in CompanyPage.tsx - cast querySelector to HTMLElement."""
import os

path = "../frontend/src/pages/CompanyPage.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace querySelector calls with HTMLElement casts
content = content.replace(
    "document.querySelector('[data-tab=\"documents\"]')?.click()",
    "(document.querySelector('[data-tab=\"documents\"]') as HTMLElement)?.click()"
)
content = content.replace(
    "document.querySelector('[data-tab=\"contacts\"]')?.click()",
    "(document.querySelector('[data-tab=\"contacts\"]') as HTMLElement)?.click()"
)
content = content.replace(
    "document.querySelector('[data-tab=\"campaigns\"]')?.click()",
    "(document.querySelector('[data-tab=\"campaigns\"]') as HTMLElement)?.click()"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed CompanyPage.tsx")

# Also add data-tab attributes to tab buttons in the same file
# The tab buttons need data-tab="documents" etc for this to work
content2 = content
# Check if data-tab attributes are already present
if 'data-tab="documents"' not in content2:
    # Add data-tab to tab buttons
    content2 = content2.replace(
        'key={t.key}\n              onClick={() => setTab(t.key)}',
        'key={t.key}\n              data-tab={t.key}\n              onClick={() => setTab(t.key)}'
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content2)
    print("Added data-tab attributes to tab buttons")

print("Done")
