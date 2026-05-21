#!/usr/bin/env python3
"""Fix accessibility warnings in Login.tsx."""
path = "../frontend/src/pages/Login.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Email input — add id, name, autoComplete
content = content.replace(
    '<input\n              type="email"\n              value={email}\n              onChange={e => setEmail(e.target.value)}\n              className="input-field"\n              placeholder="you@example.com"\n              required\n              autoFocus\n            />',
    '<input\n              id="email"\n              name="email"\n              type="email"\n              autoComplete="email"\n              value={email}\n              onChange={e => setEmail(e.target.value)}\n              className="input-field"\n              placeholder="you@example.com"\n              required\n              autoFocus\n            />'
)

# Fix 2: Email label — add htmlFor
content = content.replace(
    '<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>',
    '<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>'
)

# Fix 3: Password input — add id, name, autoComplete
content = content.replace(
    '<input\n                type={showPw ? \'text\' : \'password\'}\n                value={password}\n                onChange={e => setPassword(e.target.value)}\n                className="input-field pr-10"\n                placeholder="••••••••"\n                required\n              />',
    '<input\n                id="password"\n                name="password"\n                type={showPw ? \'text\' : \'password\'}\n                autoComplete="current-password"\n                value={password}\n                onChange={e => setPassword(e.target.value)}\n                className="input-field pr-10"\n                placeholder="••••••••"\n                required\n              />'
)

# Fix 4: Password label — add htmlFor
content = content.replace(
    '<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>',
    '<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Login.tsx accessibility issues")
