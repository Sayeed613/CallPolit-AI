# CallPilot AI — Founder's Walkthrough Guide

> **Purpose:** Use this doc as your script when walking through the project with the frontend developer.  
> **Tone:** Speak naturally — this is written in the words you'd say.  
> **Time:** ~30-40 minute walkthrough

---

## Before the Meeting — Prep Checklist

- [ ] Share the repo link: `https://github.com/Sayeed613/CallPolit-AI`
- [ ] Ask him to clone it and have Node.js + Python ready
- [ ] Send the `FRONTEND_HANDOFF.md` document 1 hour before (so he can skim it)
- [ ] Have your Supabase project login ready (to show the DB tables live)
- [ ] Have your Twilio console open (to show the phone number)
- [ ] **🎥 Optional: Record a 2-minute Loom video of a working call** (backup in case live demo fails)
- [ ] Have screenshots ready of what you envision the UI looking like
- [ ] Bring any competitor apps or design references you like

---

## Meeting Agenda (Suggested)

| Time | Topic | Style |
|------|-------|-------|
| 5 min | **The Big Picture** — What are we building and why | Whiteboard/conceptual |
| 5 min | **Architecture Tour** — How it all fits together | Screen share + diagrams |
| 5 min | **Live Demo** — Make a call right now (if possible) | Hands-on |
| 10 min | **API Deep Dive** — Walk through every endpoint he'll need | Code + docs |
| 5 min | **Database Schema** — Tables he needs to know | Supabase dashboard |
| 5 min | **What's Coming** — Phase 2 features he'll build | Discussion |
| 5 min | **Q&A + His Input** — What does he need from us? | Open discussion |

---

## 1. The Big Picture (What to Say)

> *"So here's what we're building — CallPilot AI. It's an AI voice assistant for Indian businesses. Think of it like an automated call center agent that can call hundreds of customers, talk to them naturally in Hindi, answer their questions using your clinic's PDFs, and log everything."*

**Three things it does:**
1. **📄 Understands your business** — You upload a PDF (timings, services, prices), the AI reads it
2. **📞 Calls customers automatically** — Campaign system: upload contacts, set calls-per-minute, AI calls them one by one
3. **💬 Converses naturally** — Customer speaks in Hindi → AI understands → searches the PDF → answers in Hindi

> *"We're Indian-business-first. Most AI tools are built for English call centers in the US. We need Hindi support, Indian phone number handling, clinic PDFs, etc."*

---

## 2. Architecture Tour (What to Say)

> *"Let me show you how it's wired up."*

**Draw this on a whiteboard or open the diagram in `FRONTEND_HANDOFF.md`:**

```
[React Frontend] ──API calls──> [FastAPI Backend] ──> [Supabase DB]
                                       │
                                  [Twilio] ──> [Customer Phone]
                                       │
                                  [Gemini AI]
```

**Explain each piece:**
- **Frontend (React)** — That's what you'll build. Dashboard, document upload, campaign launch, analytics
- **Backend (FastAPI, Python)** — I've built this. 11 endpoints, handles everything
- **Twilio** — The phone company. Makes calls, converts speech↔text
- **Gemini AI** — Google's AI. Two jobs: (1) generate responses, (2) create embeddings for search
- **Supabase** — Our database. PostgreSQL with vector search (pgvector). Also handles authentication

> *"The key insight: your frontend ONLY talks to the FastAPI backend via REST APIs. You never talk to Twilio or Gemini directly. The backend is your single source of truth."*

---

## 3. Live Demo (Optional — Impressive if it works)

> *"Let me show you a live call in action."*

**Option A — Live Call (if everything is running):**
1. Show the terminal with `uvicorn main:app` running
2. Open ngrok URL or live server URL
3. Trigger a test call via the script
4. Let him hear the AI greeting + ask a question

**Option B — Recorded Video (safer, recommended backup):**
> *"In case the demo doesn't cooperate, I recorded a call earlier. Let me show you."*
- Play a 2-minute Loom of a working call
- Show the Supabase table with call logs afterwards

**Option C — Just the Data:**
- Open Supabase → Table Editor → `call_logs` table
- Show a real call transcript row
- Show the `campaigns` table with called/connected counters

> *"This is the core loop. Your frontend job is to **manage** this — upload PDFs, launch campaigns, show call logs. The actual calling is handled by the backend."*

---

## 4. API Deep Dive (The Important Part for Him)

> *"Let me show you the 8 API endpoints your frontend will call."*

**Open `FRONTEND_HANDOFF.md` Section 3 and walk through each one:**

### Authentication First
> *"Every request except health check needs a JWT token. You get it from Supabase Auth on login."*

```js
// Show him this pattern:
const token = (await supabase.auth.signInWithPassword({
  email, password
})).data.session.access_token;

fetch('/api/company/create', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Endpoint Walkthrough (5 minutes)

**1. Create Company — `POST /api/company/create`**
> *"First step after login. User creates their business. Mode is important — 'inbound' means they only receive calls, 'outbound' means they can launch campaigns, 'both' means everything."*

**2. Upload Document — `POST /api/documents/upload`**
> *"User uploads a PDF. The backend extracts text, splits it into chunks, generates embeddings, stores in vector DB. This is how the AI learns about the business."*
> 
> *"Important: It's multipart form upload — not JSON. Here's the pattern."* (show the FormData example)

**3. Search Documents — `POST /api/documents/query`**
> *"This is for testing. User can type a question and see what chunks match. Useful for debugging — 'is my PDF actually being read?'"*

**4. Upload Contacts — `POST /api/contacts/upload`**
> *"CSV or Excel with phone numbers. The backend auto-normalizes Indian numbers. '9876543210' becomes '+919876543210'."*

**5. Launch Campaign — `POST /api/campaign/launch`**
> *"This is the big one. User clicks 'Launch', we schedule all calls with delays. Each call goes through the full voice pipeline."*

**6. Company Details — `GET /api/company/get/{id}`**
> *"Get company info. Use this after login to load the dashboard."*

> *"The other 3 endpoints are Twilio webhooks — you never call them directly. Just know they exist."*

---

## 5. Database Schema (What to Say)

> *"Let me show you the actual database in Supabase."*

**Open Supabase dashboard → Table Editor and show:**

| Table | Why for Frontend |
|-------|------------------|
| `companies` | Show company name, mode, plan on dashboard |
| `contacts` | Show contact list, status (pending/called/failed) |
| `campaigns` | Show campaign progress (called vs total) |
| `documents` | Show uploaded PDFs and their status |
| `call_logs` | Show transcripts, duration, outcomes |

> *"The `document_chunks` table is the secret sauce — vectors live here. You don't need to build UI for it, just know it exists. The `embedding` column is where the AI magic lives."*

---

## 6. What's Coming (Phase 2)

> *"Here's what's NOT built yet — and this is where I want your input."*

**These are features I think we need, but you're the frontend expert. Tell me:**
- What's realistic?
- What order makes sense?
- What am I missing?

**Phase 2 Backend (I'll build):**
- **Campaign Analytics** — `GET /api/campaign/{id}/stats` — so dashboard shows called/connected/hot_leads in real-time
- **Call Logs Viewer** — `GET /api/call-logs?company_id=xxx` — browse transcripts
- **Contact CRUD** — Edit, delete, search contacts
- **Document Manager** — List all documents, delete, re-upload
- **Company Settings** — Update profile, change mode

**Phase 2 Frontend (His job):**
- Campaign progress dashboard with live counters
- Call transcript viewer with search
- Contact list with filters
- Document library

> *Ask him: "Which of these should we prioritize first? What dependencies do you see?"*

---

## 7. Questions to Ask the Developer

Start with: *"I've told you about the project. Now I want to hear from you — how do you like to work?"*

1. **"What frontend framework do you prefer? React + TypeScript with Tailwind?"**
   - (Confirm: we assumed React + TypeScript)

2. **"Have you worked with Supabase Auth before?"**
   - (If yes, great. If no, show him the auth section in the handoff doc)

3. **"Do you want to build the UI from scratch or use a component library?"**
   - (Suggestions: shadcn/ui, Material UI, or Ant Design for Indian businesses)

4. **"Real-time campaign progress — would WebSockets work or is polling fine?"**
   - (Polling is easier. WebSockets are fancier.)

5. **"Can you share your GitHub username so I can add you as a collaborator?"**

6. **"What's your timeline — when can you start, and what's your weekly availability?"**

---

## 8. After the Meeting — Action Items

- [ ] Add him as a collaborator on GitHub
- [ ] Create a shared Notion/Google Doc for specs
- [ ] Set up a recurring weekly sync (30 min)
- [ ] Decide on first feature he'll build (suggest: Login page + Dashboard)
- [ ] Create a Slack/WhatsApp group for quick questions

---

## Quick Cheat Sheet — Answers to Likely Questions

**Q: "Why FastAPI and not Node.js?"**  
A: "Python has the best AI/ML libraries. FastAPI is the fastest Python web framework. When you need Gemini embeddings and RAG pipelines, Python is the right choice."

**Q: "How does the AI handle Hindi?"**  
A: "Google Gemini is natively multilingual. The embedding model (`gemini-embedding-001`) understands semantic meaning across languages. 'Timings' in Hindi and 'timings' in English map to the same vector space."

**Q: "How many calls can we make per minute?"**  
A: "Configurable per campaign. Default is 2/minute. We can go up to ~10/minute before Twilio rate-limits us."

**Q: "What happens if the AI doesn't know the answer?"**  
A: "It says 'I'll connect you with our team' instead of making something up. The prompt is very strict — 'Answer ONLY using the context.'"

**Q: "How do we debug failed calls?"**  
A: "Check `call_logs` table. Each call has a `status`, `transcript`, and `duration_seconds`. If a call failed, the status tells you why."

**Q: "Is this production-ready?"**  
A: "The voice pipeline works end-to-end. The frontend is what's missing. Once you build the UI, we have a real product."

---

## Notes for You (Founder)

- **You don't need to know the code** — Just understand how the pieces connect. The developer will write React, you explain what data it needs.
- **Be honest about scope** — Say "I built the backend but the frontend is where we need you."
- **Let him ask questions** — The `FRONTEND_HANDOFF.md` has all the technical details. If he asks something you don't know, say "It's in the handoff doc — let's look together."
- **Trust the architecture** — FastAPI + Supabase + Gemini + Twilio is a proven stack. There are no architectural risks.
- **You're the vision holder** — You know what the product should feel like. He'll translate that into code.

---

*Good luck with the meeting! 🚀*
