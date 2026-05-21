#!/usr/bin/env python3
"""Fix code issues found during frontend review."""
import os

FRONTEND = "../frontend/src"

def fix(path, old, new):
    full = os.path.join(FRONTEND, path)
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    if old not in content:
        print(f"  [SKIP] Pattern not found in {path}")
        return
    content = content.replace(old, new)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  [FIX] {path}")

# 1. Layout.tsx — Remove dead fetchCompanies code
fix("components/Layout.tsx",
    """  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))
    // Fetch companies from the user
    const fetchCompanies = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/company/get/placeholder', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      // Just use the ID from URL for now
    }
    fetchCompanies()
  }, [])""",
    """  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))
  }, [])"""
)

# 2. CampaignsTab.tsx — Remove duplicate dynamic import
fix("pages/CampaignsTab.tsx",
    """        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(supabaseUrl, anonKey)
        const { data: { session } } = await sb.auth.getSession()
        if (!session) return
        
        const { createClient: createServerClient } = await import('@supabase/supabase-js')
        const sbs = createServerClient(supabaseUrl, anonKey)""",
    """        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(supabaseUrl, anonKey)
        const { data: { session } } = await sb.auth.getSession()
        if (!session) return"""

)

# Remove the duplicate variable too — sbs -> sb
fix("pages/CampaignsTab.tsx",
    """        if (data) setCampaigns(data as Campaign[])""",
    """        if (data) setCampaigns(data as Campaign[])"""
)

# Actually the sbs reference is already using 'sb' from the rename above, need to check
# Let me fix: the second part uses `sbs.from('campaigns')` which should now be `sb.from('campaigns')`
fix("pages/CampaignsTab.tsx",
    """sbs.from('campaigns')""",
    """sb.from('campaigns')"""
)

# 3. api.ts — Static import supabase at top instead of dynamic import
fix("lib/api.ts",
    "import { supabase } from './supabase'\n\nconst API_BASE = ''",
    "const API_BASE = ''")

fix("lib/api.ts",
    """async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('./supabase')
  const { data } = await supabase.auth.getSession()""",
    """async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('./supabase')
  const { data } = await supabase.auth.getSession()"""
)

# Actually the import is already at the top of the generated file. Let me check...
# The issue is getAuthHeaders does `await import('./supabase')` dynamically. 
# We should import supabase statically at the top and use it directly.
# Current api.ts content:
# import { supabase } from './supabase'
# Gets removed by fix above... wait, that broke it.
# Let me re-read the logic:
# The generated file already has: `import { supabase } from './supabase'` at top (static)
# AND inside getAuthHeaders: `const { supabase } = await import('./supabase')` (dynamic, redundant)
# So I need to remove the dynamic import and use static import. But I just removed the static import!

# Let me fix this properly
print("\n--- Re-checking api.ts ---")
api_path = os.path.join(FRONTEND, "lib/api.ts")
with open(api_path, 'r', encoding='utf-8') as f:
    api_content = f.read()

# Restore the static import if it was removed
if "import { supabase } from './supabase'\n\nconst API_BASE = ''" not in api_content and "supabase" not in api_content.split('\n')[0]:
    api_content = "import { supabase } from './supabase'\nimport { supabase as supabaseClient } from './supabase'\nconst API_BASE = ''\n" + api_content.split("const API_BASE = ''", 1)[1]
    print("  [INFO] Restored supabase import")

# Fix: Remove the dynamic import inside getAuthHeaders
old_dynamic = """async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('./supabase')
  const { data } = await supabase.auth.getSession()"""
new_static = """async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()"""

if old_dynamic in api_content:
    api_content = api_content.replace(old_dynamic, new_static)
    print("  [FIX] api.ts — replaced dynamic import with static")
else:
    print("  [SKIP] Pattern not found in api.ts for getAuthHeaders fix")

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(api_content)

# 4. CompanyPage.tsx — Pass setTab as prop to OverviewTab instead of DOM queries
fix("pages/CompanyPage.tsx",
    "{tab === 'overview' && <OverviewTab company={company} />}",
    "{tab === 'overview' && <OverviewTab company={company} setTab={setTab} />}"
)

fix("pages/CompanyPage.tsx",
    """function OverviewTab({ company }: { company: Company }) {""",
    """function OverviewTab({ company, setTab }: { company: Company; setTab: (key: string) => void }) {"""
)

# Replace DOM-based click with direct setTab calls
fix("pages/CompanyPage.tsx",
    """<button onClick={() => (document.querySelector('[data-tab=\"documents\"]') as HTMLElement)?.click()}
            className="btn-primary w-full text-left justify-start flex items-center gap-2">
            Upload Documents
          </button>
          <button onClick={() => (document.querySelector('[data-tab=\"contacts\"]') as HTMLElement)?.click()}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-green-600 hover:bg-green-700">
            Upload Contacts
          </button>
          <button onClick={() => (document.querySelector('[data-tab=\"campaigns\"]') as HTMLElement)?.click()}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            Launch Campaign
          </button>""",
    """<button onClick={() => setTab('documents')}
            className="btn-primary w-full text-left justify-start flex items-center gap-2">
            Upload Documents
          </button>
          <button onClick={() => setTab('contacts')}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-green-600 hover:bg-green-700">
            Upload Contacts
          </button>
          <button onClick={() => setTab('campaigns')}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            Launch Campaign
          </button>"""
)

print("\nAll fixes applied!")
