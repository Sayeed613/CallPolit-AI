# CallPilot AI — AI Co-Pilot for Call Center Agents

**CallPilot is an AI assistant that sits alongside human call center agents and helps them work 2x faster, with fewer errors, and better customer experience. It's not about replacing agents — it's about supercharging them.**

---

## Table of Contents

1. [The Vision](#the-vision)
2. [The Product: Two Co-Pilots](#the-product-two-co-pilots)
   - [Inbound Co-Pilot (Customer Support)](#1-inbound-co-pilot-customer-support)
   - [Outbound Co-Pilot (Call Center)](#2-outbound-co-pilot-call-center)
3. [The Market Opportunity](#the-market-opportunity)
4. [Competitive Landscape](#competitive-landscape)
5. [Call Center Types We Serve](#call-center-types-we-serve)
6. [Customer Model (Renamed from Contacts)](#customer-model-renamed-from-contacts)
7. [Industry-Specific Verification Matrix](#industry-specific-verification-matrix)
8. [Outbound vs Inbound — The Two Core Flows](#outbound-vs-inbound--the-two-core-flows)
9. [Call Flow Builder (Visual Workflow)](#call-flow-builder-visual-workflow)
10. [Call Simulation Engine](#call-simulation-engine)
11. [Full Tech Stack Architecture](#full-tech-stack-architecture)
12. [Database Schema](#database-schema)
13. [API Routes](#api-routes)
14. [Frontend Architecture](#frontend-architecture)
15. [Current State Assessment](#current-state-assessment)
16. [MVP Build Plan](#mvp-build-plan)
17. [Cost Breakdown (Free Tier, Production-Level)](#cost-breakdown-free-tier-production-level)
18. [Getting Started](#getting-started)

---

## The Vision

**One-liner:** *An AI co-pilot for Indian call center agents that handles verification, suggests responses, transcribes calls, and automates post-call work — so agents can focus on what matters: the customer.*

### Why This, Why Now?

| Problem | Solution |
|---|---|
| Agents waste 30% of call time on data entry | AI auto-logs everything |
| New agents take 3 months to get good | AI suggests responses from Day 1 |
| Customers hate repeating themselves | AI verifies and hands off context |
| Call center owners can't find good agents | AI makes every agent 2x productive |
| Compliance mistakes cost crores | AI monitors every call in real-time |

### What Makes This Different for India

- **Indian languages** — Hindi, Kannada, Tamil, Telugu, English — naturally, not "translated English"
- **Indian ID systems** — Aadhaar, PAN, customer ID verification built-in
- **Indian call center workflows** — Not a US product ported to India
- **Indian pricing** — ₹ per call, not dollars
- **No phone setup needed** — Works with any telephony provider (Twilio, Exotel, Plivo)

---

## The Product: Two Co-Pilots

### 1. INBOUND CO-PILOT (Customer Support)

When a customer calls and a **human agent** is on the line:

```
CUSTOMER CALLS → AI answers first → Verifies identity → Understands issue → Transfers to human WITH CONTEXT

HUMAN AGENT SEES ON THEIR SCREEN:
┌──────────────────────────────────────────────────┐
│ 📞 Call from: +91 98765 43210                     │
│ ✅ Verified: Rajesh Kumar                         │
│ 🏦 Account: XXXXXX1234                            │
│ 📋 Issue: "I didn't receive my policy document"   │
│ 💡 Suggested Response: "I apologize Mr. Kumar,    │
│    let me resend the policy to your registered    │
│    email right away."                              │
│ 📄 Relevant KB Article: Policy Delivery FAQ       │
│ 😠 Sentiment: Frustrated — handle with care       │
└──────────────────────────────────────────────────┘
```

**Features:**

| Feature | What It Does |
|---|---|
| **Real-time transcription** | Shows what the customer is saying as scrolling text |
| **Sentiment detection** | Alerts agent when customer is angry, confused, or satisfied |
| **Response suggestions** | AI generates 2-3 suggested replies based on company docs |
| **Auto-verification** | AI verifies identity (Aadhaar/PAN/phone) before handoff |
| **Knowledge base search** | Pulls relevant articles instantly while agent talks |
| **Auto-summary** | After the call, AI writes complete notes |
| **CRM auto-fill** | Updates customer record automatically |

### 2. OUTBOUND CO-PILOT (Call Center)

When a **call center agent** is making outbound calls:

```
AGENT MAKES CALL → AI dials → Customer picks up → AI whispers suggestions

AGENT SEES ON THEIR SCREEN:
┌──────────────────────────────────────────────────┐
│ 📞 Calling: Priya Sharma                         │
│ 🎯 Campaign: Home Loan Offer                     │
│ 📋 Script Step 2/5: "Discuss interest rates"     │
│ 💬 Customer said: "I already have a loan"        │
│ 🔄 Suggested: "I understand. Would you be        │
│    interested in a top-up loan at 8.5%?"          │
│ 📊 Profile: VIP, previous loan ₹5L               │
│ ✅ Next Action: Offer top-up or transfer to RM   │
└──────────────────────────────────────────────────┘
```

**Features:**

| Feature | What It Does |
|---|---|
| **Auto-dialing** | AI dials next number — agent only speaks when connected |
| **Script guidance** | Shows current step of the call script |
| **Objection handling** | Suggests responses for common objections |
| **Customer insights** | Past interactions, preferences, lifetime value |
| **Live transcription** | Real-time speech-to-text during the call |
| **Disposition logging** | Auto-marks outcome: interested, not, busy, callback |
| **Appointment booking** | "Customer wants callback at 5pm" → auto-books |

### Why Co-Pilot > Full Automation

| | Full AI Automation | CallPilot Co-Pilot |
|---|---|---|
| **Accuracy needed** | 100% — one mistake loses trust | 80% is fine — human double-checks |
| **Trust factor** | Low — "AI will screw up" | High — "AI helps me do better" |
| **Regulation** | Hard — BFSI needs human oversight | Easy — human approves everything |
| **Cost** | ₹5-10 per call | ₹1-2 per call (agent already paid) |
| **Agent morale** | "You're replacing us" | "You're making my job easier" |
| **Compliance** | Risky — AI may say wrong thing | Safe — human controls responses |
| **Sales cycle** | Long — "let us test this AI" | Short — "this helps my team today" |

**The pitch to call center owners:**
> *"Your agents cost ₹25,000/month each. With CallPilot, each agent handles 2x more calls, makes fewer mistakes, and customers are happier. You don't fire anyone — you just get more out of every agent."*

---

## The Market Opportunity

### India/Bangalore Context

Bangalore alone has:
- **Thousands of real estate agents** calling prospects daily
- **Hundreds of fintech/insurance companies** doing verification calls
- **Countless clinics/hospitals** doing appointment reminders
- **E-commerce companies** doing delivery confirmation and feedback
- **Edtech** doing sales follow-ups

**Current reality:** Most still use human agents or basic IVR systems. The ones using AI are paying ₹2-5 per minute to US companies that don't understand Indian languages or workflows.

### Your 5 Unfair Advantages

| Advantage | Why It Matters |
|---|---|
| **Indian languages, naturally** | Not "translate English to Hindi" — real code-switching, real accents |
| **Indian ID systems built-in** | Aadhaar, PAN, customer IDs — pre-built verification |
| **Call center workflows** | Built by someone who understands how Indian call centers run |
| **Indian pricing** | ₹ per call, UPI payments, no dollar conversion |
| **No setup demo** | Simulation mode works in-browser — no phone number needed to demo |

---

## Competitive Landscape

### Global Players (US/Europe)

| Company | Focus | Their India Weakness |
|---|---|---|
| **Retell AI** | US sales calls | English-only, $0.08/min, no Indian languages |
| **Bland AI** | Enterprise sales | $0.12/min, API-only, no local support |
| **Air AI** | Real-time voice | No campaign system, no scheduling |
| **Synthflow** | No-code voice bots | Generic, no India market understanding |
| **Vapi** | Developer API | Raw infra, not a call center product |
| **PlayHT** | Voice cloning + TTS | Not a call center product |

**These miss India because:**
1. Indian call centers don't know they exist
2. Dollar pricing = ₹6-10/min = more than a human agent's monthly salary
3. "Hindi support" is always broken
4. Indian phone format (+91, landlines, missed calls) not handled
5. No local support — 24-hour email response

### Indian Players

| Company | Focus | Their Weakness |
|---|---|---|
| **Ozonetel** | Cloud call center, basic IVR | Old tech, not AI-native, expensive setup |
| **Knowlarity** | Cloud telephony | AI is an add-on, not core |
| **Exotel** | CPaaS + engagement | API-focused, not for non-tech users |
| **Ameyo** | Contact center | Legacy on-premise, expensive |
| **AI Rudder** | Voice for BFSI | Collections only, one vertical |
| **Skydo** | AI voice agent | Building on top of existing APIs |

**Pattern:** Most Indian "AI calling" companies are either old telephony cos adding AI as a feature, or niche players focused on one vertical.

### Your Pitch vs Each

**Vs global AI (Retell, Bland):**
> *"They charge in dollars and don't speak Hindi, Kannada, or Tamil. CallPilot is built for Indian businesses — Indian languages, Indian ID systems, Indian pricing."*

**Vs Exotel, Knowlarity:**
> *"They give you a dialer. We give you an AI agent that handles the entire conversation, books appointments, and writes summaries. And you can test it right now in your browser."*

**Vs AI Rudder:**
> *"They do ONE thing — collections. You run multiple campaigns — sales, feedback, reminders — all from one dashboard. Upload a different document, get a different script. Same system."*

---

## Call Center Types We Serve

| Type | Example | Their Process |
|---|---|---|
| **Real Estate** | Bangalore broker | Call leads → Pitch property → Answer questions → Book site visit |
| **Banking/Finance** | HDFC, ICICI | Verify customer → Offer product → Handle objections → Close |
| **Insurance** | PolicyBazaar | Renewal reminder → Explain policy → Answer claims → Follow up |
| **Healthcare** | Manipal Hospital | Confirm appointment → Check symptoms → Give instructions → Remind |
| **Collections** | Bajaj Finance | Verify identity → Remind payment → Negotiate → Set promise date |
| **Telemarketing** | Amazon Pay | Pitch offer → Handle rejections → Try 3x → Close |
| **Survey** | Government agency | Ask 20 fixed questions → Record answers → Thank |
| **Customer Support** | Jio, Airtel | Listen → Search KB → Resolve → Confirm satisfaction |
| **Edtech** | Byju's, Unacademy | Demo follow-up → Answer queries → Enroll → Support |

---

## Customer Model (Renamed from Contacts)

**"Contacts" is replaced with "Customers"** — because that's what they are: verified individuals with identity, history, and preferences.

```
CUSTOMER
├── Basic Info
│   ├── name (required)
│   ├── phone (required, primary identifier)
│   ├── alternate_phone
│   ├── email
│   └── language (hindi, english, kannada, tamil, telugu, etc.)
│
├── Identity Documents (for verification)
│   ├── aadhaar_number (encrypted)
│   ├── pan_number
│   ├── customer_id (company-specific)
│   ├── account_number (BFSI)
│   └── date_of_birth
│
├── Verification Status
│   ├── verification_level (0-3)
│   │   0 = Not verified
│   │   1 = Phone verified (call connected)
│   │   2 = Document verified (Aadhaar/PAN match)
│   │   3 = Full KYC (multiple docs)
│   └── verified_at
│
├── Profile
│   ├── status (active, inactive, blocked, vip, dnc)
│   ├── dnc_preference (yes/no)
│   ├── preferred_time_slot
│   └── tags (string[])
│
├── Account
│   ├── total_calls
│   ├── last_called_at
│   ├── total_appointments
│   ├── total_purchases (e-commerce)
│   └── lifetime_value
│
└── History
    ├── call_logs[]
    ├── appointments[]
    └── notes[]
```

---

## Industry-Specific Verification Matrix

| Industry | Inbound Verification Needs | Outbound Script Type |
|---|---|---|
| **Banking/Finance** | Aadhaar, PAN, Customer ID, DOB | Loan offer, credit card, collection |
| **Insurance** | Policy Number, DOB, Phone | Renewal, claim follow-up |
| **Real Estate** | Name, Project Name, Phone | Site visit, new launch info |
| **Healthcare** | Patient ID, DOB, Registration | Appointment reminder, follow-up |
| **E-commerce** | Order ID, Phone, Email | Delivery confirmation, feedback |
| **Telecom** | Mobile Number, DOB, Account PIN | Plan upgrade, bill reminder |
| **Edtech** | Name, Course, Batch | Demo follow-up, enrollment |
| **Government** | Aadhaar, Mobile, Scheme ID | Survey, benefit verification |

---

## Outbound vs Inbound — The Two Core Flows

### OUTBOUND Flow

```
1. CREATE CAMPAIGN
   ├── Campaign name, industry, language
   └── Upload script/docs → RAG indexes content

2. LOAD CUSTOMERS
   ├── Import CSV (name, phone, email)
   └── Optionally: Aadhaar, PAN, account number

3. LAUNCH CAMPAIGN
   ├── Set calls per minute
   ├── Choose schedule (now/later)
   └── Campaign status → running

4. AI MAKES CALLS
   ├── Dial customer → Ringing → Answered
   ├── AI identifies itself
   ├── AI follows script from docs
   ├── AI handles objections
   └── AI logs disposition (interested/not/busy/wrong)

5. POST-CALL
   ├── AI writes summary
   ├── AI books appointment if "call me later"
   └── Campaign completes after all contacts processed
```

### INBOUND Flow

```
1. CUSTOMER CALLS
   ├── AI answers within 1 second
   └── Caller ID matched to customer database

2. VERIFICATION (auto)
   ├── Level 1: Match phone number to customer record
   ├── Level 2: Ask for Aadhaar last 4 digits / PAN / DOB
   └── Level 3: Full KYC if needed

3. UNDERSTAND ISSUE
   ├── AI listens to customer's initial request
   └── AI categorizes: complaint, query, purchase, support

4. ROUTE TO HUMAN AGENT
   ├── Transfer call with full context
   ├── Agent dashboard shows: verified profile, issue summary, suggested responses
   └── AI continues to assist during call (live transcription, suggestions)

5. POST-CALL
   ├── AI writes summary
   ├── AI updates CRM
   └── AI schedules follow-up if needed
```

---

## Call Flow Builder (Visual Workflow)

Instead of hardcoding every industry's process, call centers **design their own flow** using a drag-and-drop builder:

### Each Node Configures AI Behavior

```json
{
  "id": "node_greeting",
  "type": "greeting",
  "prompt": "Introduce yourself and ask how the customer is doing",
  "next_nodes": {
    "default": "node_identify"
  }
}
```

### Built-in Node Types

| Node Type | Purpose |
|---|---|
| `greeting` | Introduce AI, ask initial question |
| `identify` | Verify customer identity |
| `pitch` | Deliver sales/marketing message |
| `question` | Ask a specific question (survey) |
| `conditional` | Branch based on customer response |
| `appointment` | Book a follow-up callback |
| `escalate` | Transfer to human agent |
| `end` | Close the call |

### Industry Templates (Pre-Built)

Industry templates ship with ready-made flows — call centers just upload their docs and start calling:

| Template | Flow Nodes |
|---|---|
| **Real Estate** | Greeting → Ask interest → Pitch property → Book visit → End |
| **Insurance Renewal** | Greeting → Verify policy → Explain renewal → Handle objections → Close |
| **Appointment Reminder** | Greeting → Confirm identity → Confirm time → Reschedule? → End |
| **Feedback Survey** | Greeting → Verify → Ask Q1 → Ask Q2 → ... → Thank → End |
| **Collections** | Greeting → Verify → Remind → Negotiate → Set promise date → End |

### How Different Industries Get Different Results

Every call center is unique, but they all use the **same engine**:

```
┌───────────────────────┐
│  Call Flow Template   │ ← Industry-specific (real estate vs banking)
├───────────────────────┤
│  Company Documents    │ ← The knowledge (RAG embeddings)
├───────────────────────┤
│  Customer Data        │ ← Their contacts with verification fields
├───────────────────────┤
│  AI Engine (Gemini)   │ ← Same engine, different inputs
└───────────────────────┘
```

Result: **Same codebase, different flows, different outcomes.**

---

## Call Simulation Engine

The simulation engine lets you demo the full product **without a phone number or Twilio**. Two AI agents talk to each other:

- **Agent A (Your AI):** Uses Gemini + company docs to run the call
- **Agent B (Simulated Customer):** A separate Gemini prompt roleplaying as a real customer

### Architecture

```
FRONTEND (WebSocket)
     │
     ▼
SIMULATION CONTROLLER
     │
     ├── Campaign Orchestrator
     │   ├── Reads contact list
     │   └── Spawns call engine per contact
     │
     ├── Call Engine
     │   ├── State Machine: queued → ringing → in-progress → completed/failed
     │   ├── Turn counter, sentiment tracker
     │   └── Appointment detection
     │
     └── Gemini AI Router
         ├── Company AI (uses RAG + system prompt)
         └── Customer AI (roleplays with personality)
              ├── Persona: "busy professional, Hindi/English mix"
              ├── Behaviors: picks up, objects, asks questions, agrees
              └── Randomization: might not answer, might be angry
```

### WebSocket Events Streamed to Frontend

| Event | Data |
|---|---|
| `call_state` | `{ status: "ringing" \| "in-progress" \| "completed" }` |
| `transcript` | `{ role: "ai" \| "customer", text: "..." }` |
| `sentiment` | `{ score: 0.8 }` |
| `appointment_booked` | `{ time: "2024-01-01T15:00", note: "..." }` |
| `call_ended` | `{ reason: "completed" \| "failed" \| "no-answer" }` |

### 5 Simulated Customer Scenarios

| Scenario | Customer Behavior | Duration |
|---|---|---|
| **Interested** | Picks up, listens, agrees, asks one question | 5-8 turns |
| **Not interested** | Picks up, says "not interested", hangs up | 2-3 turns |
| **Call me later** | Says "I'm busy, call me at 5pm" | 3-5 turns |
| **Angry** | Complains about something, needs de-escalation | 6-10 turns |
| **Has questions** | Asks detailed questions from the docs | 8-15 turns |

---

## Full Tech Stack Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React + TS)                  │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ │
│  │ Pages   │ │Components│ │ Stores  │ │ Hooks  │ │ Lib      │ │
│  │ (lazy)  │ │ (UI Kit) │ │(Zustand)│ │(custom)│ │(API/WS)  │ │
│  └─────────┘ └──────────┘ └─────────┘ └────────┘ └──────────┘ │
│                    │              │                              │
│              HTTP / REST    WebSocket (real-time)                │
└──────────────────────┼──────────────┼───────────────────────────┘
                       │              │
┌──────────────────────┼──────────────┼───────────────────────────┐
│                   BACKEND (FastAPI + Python 3.11+)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                 FASTAPI ROUTERS                         │      │
│  │  /auth  /company  /contacts  /campaigns  /voice         │      │
│  │  /live  /analytics  /appointments  /documents          │      │
│  └────────────────────────┬───────────────────────────────┘      │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────┐      │
│  │                    SERVICES                             │      │
│  │  ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ │      │
│  │  │ Gemini AI  │ │ Twilio    │ │ Sarvam   │ │ RAG    │ │      │
│  │  │ (response) │ │ (telephony)│ │ (TTS)    │ │(search)│ │      │
│  │  └────────────┘ └───────────┘ └──────────┘ └────────┘ │      │
│  │  ┌────────────┐ ┌───────────┐ ┌────────────────────┐  │      │
│  │  │ Scheduler  │ │Simulation │ │ WebSocket Events   │  │      │
│  │  │ (campaigns)│ │ (testing)  │ │ (broadcast)        │  │      │
│  │  └────────────┘ └───────────┘ └────────────────────┘  │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                 EXTERNAL INTEGRATIONS                    │      │
│  └────────────────────────────────────────────────────────┘      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
    ┌──────────────────┼─────────────────────┐
    │                  │                     │
    ▼                  ▼                     ▼
┌────────┐       ┌────────────┐       ┌──────────┐
│Supabase│       │  Gemini    │       │  Redis   │
│(DB +   │       │  AI API    │       │ (Upstash)│
│ Auth + │       │ (embeddings│       │ (cache + │
│Storage)│       │  + chat)   │       │  state)  │
└────────┘       └────────────┘       └──────────┘
```

### Stack Detail

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS | Fast dev, type-safe, utility-first styling |
| **State** | Zustand | Lightweight, no boilerplate, works outside components |
| **Routing** | React Router v6 | Lazy routes, auth guards, nested layouts |
| **Charts** | Recharts | Simple React-native charting, responsive |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Backend** | FastAPI + Python 3.11+ | Async, auto-docs, Pydantic validation |
| **Server** | Uvicorn | ASGI, hot reload |
| **AI** | Google Gemini 2.0 Flash | Low latency, multilingual, generous free tier |
| **Embeddings** | Gemini Embedding → pgvector | No extra infra needed |
| **TTS** | Sarvam AI | Indian languages, free dev tier |
| **Telephony** | Twilio / Exotel / Plivo | Outbound/inbound calls, TwiML |
| **Database** | Supabase (PostgreSQL + pgvector) | Includes auth, storage, vector search |
| **Cache** | Upstash Redis | Call state, rate limiting |
| **Auth** | Supabase Auth | Email + password, magic links |
| **Hosting** | Vercel (frontend) + Render (backend) | Free tiers, easy deployment |
| **Error Tracking** | Sentry | Free tier, 5k events/month |
| **Rate Limiting** | SlowAPI | Per-endpoint rate limits |

---

## Database Schema

### Core Tables

```sql
-- Companies (tenant)
companies (
    id UUID PK,
    user_id TEXT,           -- Supabase auth user
    name TEXT,
    industry TEXT,          -- banking, realestate, healthcare, etc.
    mode TEXT,              -- inbound | outbound | both
    verification_level INT, -- 1-3 for customer verification strictness
    language_preference TEXT[], -- ['hindi', 'english', 'kannada']
    business_hours_start TEXT,  -- '09:00'
    business_hours_end TEXT,    -- '18:00'
    after_hours_message TEXT,
    twilio_phone_number TEXT,
    escalation_phone TEXT,  -- human supervisor number
    created_at TIMESTAMPTZ
);

-- Customers (formerly "contacts")
customers (
    id UUID PK,
    company_id UUID FK→companies,
    name TEXT,
    phone TEXT,             -- primary identifier
    alternate_phone TEXT,
    email TEXT,
    language TEXT,          -- hindi, english, kannada, tamil
    aadhaar_number TEXT,    -- encrypted
    pan_number TEXT,
    customer_id TEXT,       -- company-specific ID
    account_number TEXT,
    date_of_birth DATE,
    verification_level INT, -- 0=unverified, 1=phone, 2=doc, 3=full
    verified_at TIMESTAMPTZ,
    status TEXT,            -- active, inactive, blocked, vip, dnc
    dnc_preference BOOLEAN,
    preferred_time_slot TEXT,
    tags TEXT[],
    total_calls INT DEFAULT 0,
    last_called_at TIMESTAMPTZ,
    total_appointments INT DEFAULT 0,
    lifetime_value NUMERIC DEFAULT 0,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
);

-- Campaigns
campaigns (
    id UUID PK,
    company_id UUID FK→companies,
    name TEXT,
    status TEXT,               -- draft, scheduled, running, paused, completed
    total_contacts INT,
    calls_per_minute INT,
    language TEXT,
    schedule_type TEXT,        -- now, later
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    connected INT DEFAULT 0,
    unreachable INT DEFAULT 0,
    invalid_count INT DEFAULT 0,
    hot_leads INT DEFAULT 0,
    flow_config JSONB,         -- Call flow definition (nodes)
    created_at TIMESTAMPTZ
);

-- Call Logs
call_logs (
    id UUID PK,
    campaign_id UUID FK→campaigns,
    company_id UUID FK→companies,
    contact_id UUID FK→customers,
    agent_id UUID FK→agents,   -- human agent if assisted
    contact_name TEXT,
    contact_phone TEXT,
    caller_phone TEXT,
    twilio_call_sid TEXT,
    status TEXT,                -- queued, ringing, in-progress, completed,
                                -- no-answer, busy, failed
    duration REAL,
    direction TEXT,             -- outbound, inbound
    language TEXT,
    sentiment_score REAL,
    verification_status TEXT,   -- none, pending, verified, failed
    transcript JSONB,
    suggestions JSONB,          -- AI suggestions given to agent
    suggestion_accepted BOOLEAN,-- was AI suggestion used?
    recording_url TEXT,
    notes TEXT,
    retry_count INT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);

-- Agents (human call center agents)
agents (
    id UUID PK,
    company_id UUID FK→companies,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT,                -- available, on-call, break, offline
    skills TEXT[],              -- ['hindi', 'english', 'banking']
    total_calls_today INT,
    avg_handle_time INT,
    created_at TIMESTAMPTZ
);

-- Agent Suggestions Log
agent_suggestions (
    id UUID PK,
    call_log_id UUID FK→call_logs,
    agent_id UUID FK→agents,
    suggestion_text TEXT,
    category TEXT,              -- response, knowledge, next_action
    was_accepted BOOLEAN,
    response_time_ms INT,
    created_at TIMESTAMPTZ
);

-- Documents (uploaded PDFs for RAG)
documents (
    id UUID PK,
    company_id UUID FK→companies,
    filename TEXT,
    original_filename TEXT,
    file_size INT,
    status TEXT,                -- processing, ready, failed
    chunk_count INT,
    created_at TIMESTAMPTZ
);

-- Document chunks (vector embeddings)
document_chunks (
    id UUID PK,
    document_id UUID FK→documents,
    company_id UUID FK→companies,
    chunk_index INT,
    content TEXT,
    embedding vector(768),      -- pgvector
    created_at TIMESTAMPTZ
);

-- Appointments
appointments (
    id UUID PK,
    company_id UUID FK→companies,
    contact_id UUID FK→customers,
    contact_name TEXT,
    contact_phone TEXT,
    title TEXT,
    description TEXT,
    appointment_date DATE,
    appointment_time TIME,
    duration_minutes INT,
    status TEXT,                -- scheduled, confirmed, completed, cancelled, no-show
    booked_by TEXT,             -- ai, agent, customer
    notes TEXT,
    created_at TIMESTAMPTZ
);
```

### Indexes

```sql
-- Performance indexes for common queries
idx_customers_company     ON customers(company_id);
idx_customers_phone       ON customers(phone);
idx_campaigns_company     ON campaigns(company_id);
idx_campaigns_status      ON campaigns(status);
idx_call_logs_company     ON call_logs(company_id);
idx_call_logs_campaign    ON call_logs(campaign_id);
idx_call_logs_contact     ON call_logs(contact_id);
idx_call_logs_status      ON call_logs(status);
idx_call_logs_created_at  ON call_logs(created_at);
idx_documents_company     ON documents(company_id);
idx_appointments_company  ON appointments(company_id);
idx_appointments_date     ON appointments(appointment_date);
```

---

## API Routes

### Public / Health

| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/health` | Detailed health |

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |

### Company

| Method | Route | Description |
|---|---|---|
| GET | `/api/company` | Get company details |
| POST | `/api/company` | Create/update company |
| PUT | `/api/company` | Update company settings |

### Customers (formerly Contacts)

| Method | Route | Description |
|---|---|---|
| GET | `/api/contacts` | List customers |
| POST | `/api/contacts` | Create customer |
| GET | `/api/contacts/{id}` | Get customer detail |
| PUT | `/api/contacts/{id}` | Update customer |
| DELETE | `/api/contacts/{id}` | Delete customer |
| POST | `/api/contacts/import` | CSV import |

### Campaigns

| Method | Route | Description |
|---|---|---|
| GET | `/api/campaign/list` | List campaigns |
| POST | `/api/campaign/create` | Create campaign |
| GET | `/api/campaign/{id}` | Get campaign detail |
| POST | `/api/campaign/{id}/launch` | Start campaign |
| POST | `/api/campaign/{id}/pause` | Pause campaign |
| POST | `/api/campaign/{id}/resume` | Resume campaign |
| POST | `/api/campaign/{id}/stop` | Stop campaign |

### Voice (Twilio Webhooks)

| Method | Route | Description |
|---|---|---|
| POST | `/api/voice/outbound-call` | Initialize outbound call |
| POST | `/api/voice/gather` | Process speech input |
| POST | `/api/voice/call-status` | Call status callback |
| POST | `/api/voice/incoming-call` | Handle inbound call |

### Live (Real-time)

| Method | Route | Description |
|---|---|---|
| GET | `/api/live/calls` | Get active calls |
| GET | `/api/live/stats` | Live dashboard stats |
| WS | `/api/live/ws` | WebSocket for real-time updates |

### Simulation

| Method | Route | Description |
|---|---|---|
| POST | `/api/simulation/start` | Start simulated campaign |
| POST | `/api/simulation/stop` | Stop simulation |
| GET | `/api/simulation/status` | Get simulation status |

### Analytics

| Method | Route | Description |
|---|---|---|
| GET | `/api/analytics/stats` | Dashboard stats |
| GET | `/api/analytics/timeline` | Time-series data |
| GET | `/api/analytics/call-volume` | Call volume by period |

### Appointments

| Method | Route | Description |
|---|---|---|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/{id}` | Update appointment |
| DELETE | `/api/appointments/{id}` | Delete appointment |

### Documents

| Method | Route | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents` | List documents |
| DELETE | `/api/documents/{id}` | Delete document |

---

## Frontend Architecture

### Route Structure

```
/login              → Login page
/signup             → Signup page
/forgot-password    → Forgot password

/onboarding         → 3-step setup wizard (new users)
  /1                → Company details
  /2                → Upload documents
  /3                → Import customers

/dashboard          → Main dashboard

/customers          → Customer list (renamed from Contacts)
/customers/new      → Add customer
/customers/:id      → Customer detail
/customers/import   → CSV import

/campaigns          → Campaign list
/campaigns/new      → Create campaign
/campaigns/:id      → Campaign detail (live progress)

/live               → Live dashboard (real-time WebSocket)

/analytics          → Analytics & reports

/appointments       → Appointment calendar

/settings           → Company settings

/agent              → Agent desktop (co-pilot UI)
  /queue            → Call queue
  /active           → Active call screen
  /history          → Call history
```

### State Management (Zustand Stores)

| Store | Purpose |
|---|---|
| `authStore` | User auth, session management |
| `customerStore` | Customer CRUD, search, filters |
| `campaignStore` | Campaign CRUD, launch, status |
| `callStore` | Live calls, call state, transcripts |
| `agentStore` | Agent status, queue, active call |
| `uiStore` | Sidebar, modals, toasts, theme |
| `analyticsStore` | Dashboard stats, charts data |

### Key Components

| Component | Purpose |
|---|---|
| `AgentDesktop` | Full agent UI with transcript, suggestions, customer profile |
| `CallTranscript` | Real-time scrolling transcript with sentiment colors |
| `SuggestionPanel` | AI-generated response suggestions the agent can click |
| `CustomerProfile` | Sidebar showing customer identity, history, verification |
| `CallQueue` | Incoming call queue with customer preview |
| `SimulationDashboard` | Live simulation view with multiple call cards |
| `CampaignProgress` | Real-time campaign progress with animated counters |
| `CallFlowBuilder` | Drag-and-drop flow node editor (future) |

---

## Current State Assessment

### ✅ What Works Right Now

| Feature | Status |
|---|---|
| Auth (Login/Signup) | ✅ Supabase auth, email+password, forgot password |
| Company Setup | ✅ Create/update company, industry, hours, language |
| Document Upload | ✅ PDF → chunking → embeddings → RAG ready |
| Customers CRUD | ✅ Add/edit/delete, CSV import |
| Campaign Creation | ✅ Create campaign, set rate, schedule |
| Appointments | ✅ CRUD, list, calendar view |
| Analytics | ✅ Basic stats, Recharts |
| Dashboard | ✅ Greeting, quick actions, recent campaigns |
| WebSocket Infra | ✅ Backend WS endpoint, frontend WS manager |

### ⚠️ Partial / Needs Work

| Feature | Problem |
|---|---|
| Campaign Launch | Hits Twilio → fails without credentials |
| Live Dashboard | Shows empty/no data without simulation |
| Call Logs | Empty — no actual calls |
| Scheduler | Needs Twilio to dial |
| Settings Page | Basic, needs expansion |

### ❌ Not Built Yet

| Feature | What's Missing |
|---|---|
| Call Simulation Engine | AI-AI conversation for demo/testing |
| Agent Desktop | Co-pilot UI for human agents |
| Inbound Call Flow | Verification → routing → agent handoff |
| Smart Appointment Booking | AI detects "call me later" → auto-books |
| Auto-Callback Scheduler | Retry at appointment time |
| Customer Rename | Contacts → Customers with verification fields |
| Industry Templates | Pre-built flows (real estate, BFSI, etc.) |
| Onboarding Wizard | Guided step-by-step setup |
| Visual Flow Builder | Drag-and-drop call flow editor |
| Multi-language Voice | Sarvam AI end-to-end testing |
| Agent Performance Analytics | KPIs, scorecards, quality monitoring |

---

## MVP Build Plan

### Week 1: Call Simulation Engine + Agent Desktop

| Day | Task |
|---|---|
| 1 | Simulation backend — two-AI prompt system, call state machine |
| 2 | Simulation WebSocket events + frontend live dashboard rewrite |
| 3 | Agent Desktop — call queue, active call screen, transcript panel |
| 4 | Agent Desktop — suggestion panel, customer profile sidebar |
| 5 | Post-call summary generation + CRM auto-update |
| 6 | Polish, edge cases, demo mode (3 simultaneous simulated calls) |
| 7 | Testing + bug fixes |

### Week 2: Rename Contacts → Customers + Verification

| Day | Task |
|---|---|
| 1 | DB migration: rename table, add verification fields |
| 2 | Backend: update all routes, rename in code |
| 3 | Frontend: rename all pages, update forms |
| 4 | Verification flow — Aadhaar/PAN/phone check during inbound |
| 5 | Verification UI — badges, status, manual verify button |
| 6 | CSV import with verification fields |
| 7 | Testing + bug fixes |

### Week 3: Inbound Call Flow + Smart Scheduling

| Day | Task |
|---|---|
| 1 | Inbound routing — AI answers → verifies → routes to agent |
| 2 | Agent notification system — incoming call alert |
| 3 | Appointment detection in AI prompts |
| 4 | Auto-book appointment + scheduler callback |
| 5 | Appointment calendar sync |
| 6 | Call disposition system (post-call outcome codes) |
| 7 | Testing + bug fixes |

### Week 4: Industry Templates + Polish

| Day | Task |
|---|---|
| 1 | 3 industry templates: Real Estate, Banking, Healthcare |
| 2 | Onboarding wizard — guided 3-step setup |
| 3 | Dashboards for agents and admins |
| 4 | Error states, loading states, empty states |
| 5 | Mobile responsive pass |
| 6 | Performance optimization |
| 7 | Deployment + first 10 user onboarding |

---

## Cost Breakdown (Free Tier, Production-Level)

| Service | Plan | Cost |
|---|---|---|
| **Supabase** | Free (500MB DB, 50k users, 1GB storage, pgvector) | ₹0 |
| **Redis (Upstash)** | Free (10MB, 1000 cmds/day) | ₹0 |
| **Gemini API** | Free tier (1500 requests/day) | ₹0 |
| **Sarvam API** | Free (1000 TTS calls/mo) | ₹0 |
| **Twilio** | Buy number ($1) + test calls (~$5) | ~₹500/mo |
| **Vercel** | Free (100GB bandwidth, 6000 build min) | ₹0 |
| **Render/Railway** | Free tier for backend | ₹0 |
| **Sentry** | Free (5k events/mo) | ₹0 |
| **Domain** | `callpilot.in` or similar | ~₹100/mo |
| **Total** | | **~₹600/mo** |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase account (free tier)
- A Google Gemini API key (free)
- (Optional) A Twilio account for real calls

### Setup

```bash
# 1. Clone and install dependencies
cd backend
pip install -r requirements.txt

cd frontend
npm install

# 2. Set up environment variables
# Copy backend/.env.example to backend/.env and fill in:
#   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
#   GEMINI_API_KEY
#   TWILIO_* (optional, for real calls)

# 3. Initialize database
# Run backend/migrations/001_complete_schema.sql in Supabase SQL Editor

# 4. Start backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 5050 --reload

# 5. Start frontend
cd frontend
npm run dev
```

### Without a Phone Number (Simulation Mode)

The simulation engine works without Twilio. Just:
1. Start backend + frontend
2. Create a company
3. Upload a document (PDF with your calling script)
4. Import some customers
5. Click "Launch Campaign" → See AI calls happening in real-time

### With a Phone Number

```bash
# 1. Install ngrok
ngrok http 5050

# 2. Set PUBLIC_BASE_URL in backend/.env to ngrok URL

# 3. Add Twilio credentials to backend/.env
# TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

# 4. Restart backend → real calls work
```

---

*Built for Bangalore, India — made for Indian call centers, by someone who understands them.*
