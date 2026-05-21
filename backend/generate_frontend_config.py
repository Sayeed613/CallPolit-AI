#!/usr/bin/env python3
"""Generate frontend configuration files."""
import os, json

BASE = "../frontend"

def write(path, content):
    full = os.path.join(BASE, path)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Created: {path}")

# ─── package.json ────────────────────────────────────
pkg = {
    "name": "callpilot-frontend",
    "private": True,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "tsc -b && vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "@supabase/supabase-js": "^2.45.0",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.26.0",
        "recharts": "^2.12.0",
        "lucide-react": "^0.441.0"
    },
    "devDependencies": {
        "@types/react": "^18.3.5",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.1",
        "autoprefixer": "^10.4.20",
        "postcss": "^8.4.45",
        "tailwindcss": "^3.4.10",
        "typescript": "^5.5.4",
        "vite": "^5.4.3"
    }
}
write("package.json", json.dumps(pkg, indent=2) + "\n")

# ─── vite.config.ts ──────────────────────────────────
write("vite.config.ts", """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
})
""")

# ─── tsconfig.json ───────────────────────────────────
write("tsconfig.json", json.dumps({
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": True,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": True,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": True,
        "isolatedModules": True,
        "moduleDetection": "force",
        "noEmit": True,
        "jsx": "react-jsx",
        "strict": True,
        "noUnusedLocals": False,
        "noUnusedParameters": False,
        "noFallthroughCasesInSwitch": True,
        "forceConsistentCasingInFileNames": True
    },
    "include": ["src"]
}, indent=2) + "\n")

# ─── tailwind.config.js ──────────────────────────────
write("tailwind.config.js", """/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
""")

# ─── postcss.config.js ───────────────────────────────
write("postcss.config.js", """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""")

# ─── index.html ──────────────────────────────────────
write("index.html", """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CallPilot AI</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📞</text></svg>" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""")

# ─── .env.example ────────────────────────────────────
write(".env.example", """# Supabase credentials (from Supabase dashboard -> Settings -> API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# The backend API URL (Vite proxy handles this in dev)
# VITE_API_URL=http://localhost:5050
""")

# ─── .gitignore ──────────────────────────────────────
write(".gitignore", """node_modules
dist
.env
.env.local
*.local
""")

print("\nAll config files generated successfully!")
print(f"Location: {os.path.abspath(BASE)}")
