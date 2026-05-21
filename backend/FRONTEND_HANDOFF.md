# CallPilot AI — Frontend Developer Handoff Document

> **To:** Frontend Developer (Deloitte)  
> **From:** Backend Team  
> **Project:** CallPilot AI — AI-powered voice calling platform for Indian businesses  
> **Repo:** [https://github.com/Sayeed613/CallPolit-AI](https://github.com/Sayeed613/CallPolit-AI)  
> **Tech Stack:** FastAPI (Python) + Google Gemini AI + Twilio + Supabase (Postgres + pgvector)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Authentication Flow](#2-authentication-flow)
3. [API Reference](#3-api-reference)
4. [Database Schema](#4-database-schema)
5. [Voice Call Pipeline (Critical)](#5-voice-call-pipeline-critical)
6. [RAG Pipeline (Document Q&A)](#6-rag-pipeline-document-qa)
7. [Campaign Flow](#7-campaign-flow)
8. [Frontend Integration Guide](#8-frontend-integration-guide)
9. [Error Handling](#9-error-handling)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. System Architecture

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Dashboard  │  │ Documents    │  │ Contacts  │  │ Campaigns      │  │
│  │ & Analytics│  │ Management   │  │ Upload    │  │ Launch & Track │  │
│  └─────┬─────┘  └──────┬───────┘  └─────┬────┘  └───────┬────────┘  │
└────────┼────────────────┼────────────────┼───────────────┼───────────┘
         │                │                │               │
         │          🔐 JWT Bearer Token on ALL requests   │
         ▼                ▼                ▼               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BACKEND — FastAPI :5050                          │
│                                                                      │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌───────────────┐  │
│  │ /health  │ │ /company │ │ /docs  │ │ /contacts│ │ /campaign     │  │
│  │ No Auth  │ │  JWT 🔐  │ │ JWT 🔐│ │ JWT 🔐 │ │  JWT 🔐       │  │
│  └─────────┘ └──────────┘ └────────┘ └────────┘ └───────┬───────┘  │
│                                                          │          │
│  ┌──────────────────────┐                                │          │
│  │   Twilio Webhooks    │◄────── Twilio calls these      │          │
│  │   No Auth (public)   │         automatically          │          │
│  │  /api/voice/inbound  │                                │          │
│  │  /api/voice/handle-  │                                │          │
│  │     speech           │                                │          │
│  │  /api/voice/call-    │                                │          │
│  │     status           │                                │          │
│  └──────────────────────┘                                │          │
└─────────────────────────┼────────────────────────────────┼──────────┘
                          │                                │
                          ▼                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                              │
│                                                                      │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────────────┐   │
│  │  Twilio  │  │  Google Gemini│  │     Supabase               │   │
│  │  ☎️      │  │  🧠           │  │  ┌─────────────────────┐  │   │
│  │  Calls   │  │  - 2.5 Flash  │  │  │ Postgres + pgvector │  │   │
│  │  STT/TTS │  │    Lite (text)│  │  │ - companies         │  │   │
│  │          │  │  - Embedding  │  │  │ - contacts          │  │   │
│  │          │  │    001 (vec)  │  │  │ - campaigns         │  │   │
│  │          │  │               │  │  │ - documents         │  │   │
│  │          │  │               │  │  │ - document_chunks   │  │   │
│  │          │  │               │  │  │ - call_logs         │  │   │
│  │          │  │               │  │  └─────────────────────┘  │   │
│  └──────────┘  └───────────────┘  └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **AI Model** | Gemini 2.5 Flash Lite | Fast enough for real-time voice, available for new API keys |
| **Embeddings** | Gemini Embedding-001 | 768-dim vectors, free tier, works with Hindi/English |
| **Vector DB** | Supabase pgvector | No extra infra, same DB as everything else |
| **Voice TTS** | Twilio `<Say>` | Native Hindi support, no extra API cost |
| **Scheduling** | APScheduler | Async, survives request lifecycle via global singleton |
| **Auth** | Supabase Auth JWT | Frontend uses Supabase client for login, backend validates JWT |

---

## 2. Authentication Flow

### How It Works

1. **Frontend handles login** via `@supabase/supabase-js`:
   ```js
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: '****',
   });
   ```

2. **Supabase returns a JWT** (`data.session.access_token`)

3. **Frontend sends JWT** in every API request:
   ```http
   GET /api/company/get/{company_id}
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

4. **Backend validates** the JWT using Supabase's JWKS endpoint (cached), extracts the `sub` (user_id) claim

### Important Rules

- **All endpoints marked `JWT 🔐` require** the `Authorization: Bearer <token>` header
- **Twilio webhooks** (`/api/voice/*`) do **NOT** require auth — Twilio can't send custom headers
- **Company ownership** is enforced — user can only access companies where `companies.user_id == their user_id`
- **Mode gating** — `inbound` mode companies cannot upload contacts or launch campaigns (403 error)

### Frontend Integration

```js
// Sign in with Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

if (error) throw error;

// Store token
const token = data.session.access_token;

// Send with all requests
const response = await fetch(`${API_BASE}/api/company/get/${companyId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

---

## 3. API Reference

### 3.1 Health Check

**`GET /`** — Root endpoint

```json
// Response 200
{
  "message": "CallPilot AI Backend Running"
}
```

**`GET /health`** — Health check (no auth needed)

```json
// Response 200
{
  "status": "ok",
  "service": "CallPilot AI",
  "timestamp": "2025-05-15T10:30:00.000Z"
}
```

---

### 3.2 Company Management

#### `POST /api/company/create` — `JWT 🔐`

Create a new company. The authenticated user becomes the owner.

**Request:**
```json
{
  "name": "Apna Clinic",
  "industry": "Healthcare",
  "mode": "outbound",
  "plan": "outbound"
}
```

**Mode/Plan options:**
- `"inbound"` — can ONLY receive calls (no campaigns, no contacts upload)
- `"outbound"` — can ONLY launch campaigns
- `"both"` — full access

**Response 200:**
```json
{
  "success": true,
  "company_id": "84e67f2e-cd24-434c-a086-03b18180cc68",
  "name": "Apna Clinic",
  "mode": "outbound",
  "plan": "outbound"
}
```

**Errors:** `400` (invalid mode), `500` (DB error)

---

#### `GET /api/company/get/{company_id}` — `JWT 🔐`

Get full company details. Verifies ownership.

**Response 200:**
```json
{
  "id": "84e67f2e-cd24-434c-a086-03b18180cc68",
  "user_id": "auth-user-uuid",
  "name": "Apna Clinic",
  "industry": "Healthcare",
  "mode": "outbound",
  "plan": "outbound",
  "twilio_phone": "+16802244688",
  "created_at": "2025-05-15T10:00:00.000Z"
}
```

**Errors:** `404` (company not found), `403` (not owner)

---

### 3.3 Document Management (PDF Upload & RAG)

#### `POST /api/documents/upload` — `JWT 🔐`

Upload a PDF — the system will:
1. Store PDF in Supabase Storage
2. Extract text using pypdf
3. Split into 500-word chunks (50-word overlap)
4. Generate embeddings via Gemini Embedding-001
5. Store vectors in `document_chunks` table

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF file (`.pdf` only) |
| `company_id` | string | UUID of the company |

**Response 200:**
```json
{
  "success": true,
  "document_id": "uuid-here",
  "chunks_created": 12,
  "status": "ready"
}
```

**Errors:** `400` (not PDF, no text extracted), `403` (not owner), `500` (chunking/embedding failed)

---

#### `POST /api/documents/query` — `JWT 🔐`

Ask a question against a company's documents. Uses semantic search to find relevant chunks.

**Request:**
```json
{
  "company_id": "84e67f2e-cd24-434c-a086-03b18180cc68",
  "question": "What are the clinic timings?"
}
```

**Response 200:**
```json
{
  "question": "What are the clinic timings?",
  "chunks": [
    {
      "chunk_text": "Clinic Timings: Monday to Friday 9 AM to 7 PM, Saturday 10 AM to 2 PM, Sunday closed...",
      "similarity": 0.89
    },
    {
      "chunk_text": "We also offer emergency services on weekends...",
      "similarity": 0.72
    }
  ]
}
```

**Note:** `similarity` is cosine similarity (0 to 1). Higher = more relevant. Results are sorted by similarity descending.

**Errors:** `400` (empty question), `403` (not owner), `500` (query failed)

---

### 3.4 Contact Management

#### `POST /api/contacts/upload` — `JWT 🔐`

Upload contacts from CSV or Excel. The system validates and normalizes Indian phone numbers.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | CSV (`.csv`) or Excel (`.xlsx`, `.xls`) |
| `company_id` | string | UUID of the company |

**CSV Format:**
```csv
phone,name,email
9876543210,Rahul Sharma,rahul@example.com
+919876543210,Priya Patel,priya@example.com
```

Only `phone` column is required. `name` and `email` are optional.

**Phone number normalization (automatic):**
- `9876543210` → `+919876543210` (10 digits, Indian)
- `919876543210` → `+919876543210`
- `+919876543210` → `+919876543210` (already valid)
- Invalid numbers → skipped (returned as `skipped` count)

**Response 200:**
```json
{
  "success": true,
  "imported": 95,
  "skipped": 5,
  "total_rows": 100
}
```

**Errors:** `400` (wrong file type, no valid contacts), `403` (not owner or inbound mode), `500` (DB error)

---

### 3.5 Campaign Management

#### `POST /api/campaign/launch` — `JWT 🔐`

Launch an outbound calling campaign. Schedules calls using APScheduler with a configurable rate.

**Request:**
```json
{
  "company_id": "84e67f2e-cd24-434c-a086-03b18180cc68",
  "campaign_name": "June Follow-up Campaign",
  "calls_per_minute": 2
}
```

**What happens backend:**
1. Fetches ALL contacts with `status = "pending"` for that company
2. Creates a campaign record with `status = "running"`
3. Schedules each call with delay: `index * (60 / calls_per_minute)` seconds
4. Each call is placed via Twilio with `company_id` in the webhook URL (so AI has PDF context)

**Response 200:**
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "total_contacts": 100,
  "status": "running"
}
```

**Errors:** `400` (no pending contacts, invalid rate), `403` (not owner or inbound mode), `500` (scheduling failed)

---

### 3.6 Voice API (Twilio Webhooks)

> ⚠️ **These endpoints are called by Twilio — NOT by your frontend.**  
> Do NOT call these directly from the React app. They use Form data (not JSON).

#### `POST /api/voice/inbound` — No Auth

Called by Twilio when a call is answered. Returns TwiML XML with a greeting + speech gather.

**Twilio sends (Form data):**
```
CallSid=CA123...&From=+919876543210&To=+16802244688&CallStatus=ringing
```

**Optional query param:**
```
POST /api/voice/inbound?company_id=84e67f2e-cd24-434c-a086-03b18180cc68
```

**Response:** TwiML XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">Namaste! Main Apna Clinic ki or se bol rahi hoon.</Say>
  <Gather input="speech"
          action="https://your-ngrok.ngrok-free.app/api/voice/handle-speech?company_id=84e67f2e-cd24-434c-a086-03b18180cc68"
          speechTimeout="auto"
          language="hi-IN"
          timeout="15">
  </Gather>
</Response>
```

#### `POST /api/voice/handle-speech` — No Auth

Called by Twilio when customer speaks. Processes speech through RAG pipeline, returns next TwiML.

**Twilio sends (Form data):**
```
CallSid=CA123...&SpeechResult=mujhe clinic ke timings jaanna hai&Confidence=0.95
```

**Backend does:**
1. Checks for empty speech → prompts again
2. Detects escalation keywords → transfers to human
3. Embeds the speech → searches pgvector → retrieves top 5 chunks
4. Builds RAG prompt → sends to Gemini
5. Returns TwiML with AI response + next `<Gather>`

**Response:** Same TwiML XML format as above, but with AI's answer.

#### `POST /api/voice/call-status` — No Auth

Called by Twilio when call ends. Updates call logs and campaign/contact counters.

**Twilio sends (Form data):**
```
CallSid=CA123...&CallStatus=completed&CallDuration=120
```

**Response 200:**
```json
{
  "success": true
}
```

---

### 3.7 Summary Table

| Endpoint | Method | Auth | Request Format | Response | Purpose |
|----------|--------|------|---------------|----------|---------|
| `/` | GET | No | — | JSON | Root |
| `/health` | GET | No | — | JSON | Health check |
| `/api/company/create` | POST | JWT 🔐 | JSON body | JSON | Create company |
| `/api/company/get/{id}` | GET | JWT 🔐 | Path param | JSON | Get company |
| `/api/documents/upload` | POST | JWT 🔐 | Multipart form | JSON | Upload PDF |
| `/api/documents/query` | POST | JWT 🔐 | JSON body | JSON | Search docs |
| `/api/contacts/upload` | POST | JWT 🔐 | Multipart form | JSON | Upload contacts |
| `/api/campaign/launch` | POST | JWT 🔐 | JSON body | JSON | Launch campaign |
| `/api/voice/inbound` | POST | No | Form data | **XML** (TwiML) | Twilio webhook |
| `/api/voice/handle-speech` | POST | No | Form data | **XML** (TwiML) | Twilio webhook |
| `/api/voice/call-status` | POST | No | Form data | JSON | Twilio webhook |

---

## 4. Database Schema

### companies
```sql
id            UUID PRIMARY KEY (auto-generated)
user_id       UUID REFERENCES auth.users(id)  -- Supabase Auth user
name          TEXT
industry      TEXT
mode          TEXT  -- 'inbound' | 'outbound' | 'both'
plan          TEXT  -- same as mode for now
twilio_phone  TEXT  -- the Twilio number assigned to this company
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### contacts
```sql
id              UUID PRIMARY KEY
company_id      UUID REFERENCES companies(id)
phone           TEXT  -- E.164 format, e.g. +919876543210
name            TEXT
email           TEXT
city            TEXT DEFAULT ''
qualification   TEXT DEFAULT ''
custom_data     JSONB DEFAULT '{}'
status          TEXT DEFAULT 'pending'  -- 'pending' | 'called' | 'failed'
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### campaigns
```sql
id              UUID PRIMARY KEY
company_id      UUID REFERENCES companies(id)
name            TEXT
status          TEXT DEFAULT 'running'  -- 'running' | 'completed' | 'failed'
total_contacts  INT DEFAULT 0
called          INT DEFAULT 0
connected       INT DEFAULT 0
hot_leads       INT DEFAULT 0
language        TEXT DEFAULT 'hi-IN'
call_timing_start   TEXT DEFAULT '09:00'
call_timing_end     TEXT DEFAULT '18:00'
launched_at     TIMESTAMPTZ
completed_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### documents
```sql
id              UUID PRIMARY KEY
company_id      UUID REFERENCES companies(id)
file_name       TEXT
file_url        TEXT  -- public URL in Supabase Storage
extracted_text  TEXT  -- full extracted PDF text
status          TEXT DEFAULT 'processing'  -- 'processing' | 'ready' | 'failed'
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### document_chunks (THE CRITICAL TABLE — powers RAG)
```sql
id              UUID PRIMARY KEY
document_id     UUID REFERENCES documents(id)
company_id      UUID REFERENCES companies(id)
chunk_index     INT  -- order of chunk in the document
chunk_text      TEXT  -- 500-word chunk of the document
embedding       VECTOR(768)  -- Gemini Embedding-001 vector
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**Index:** A pgvector index (`ivfflat`) exists on `embedding` for fast cosine similarity search.

### call_logs
```sql
id                UUID PRIMARY KEY
campaign_id       UUID REFERENCES campaigns(id)  -- NULLABLE (inbound calls)
contact_id        UUID REFERENCES contacts(id)   -- NULLABLE (inbound calls)
twilio_call_sid   TEXT
status            TEXT DEFAULT 'initiated'
outcome           TEXT  -- 'escalate' if customer asked for human
transcript        TEXT DEFAULT ''  -- conversation as 'Customer: ...\nAssistant: ...' string
duration_seconds  INT DEFAULT 0
collected_data    JSONB DEFAULT '{}'  -- data gathered during call
is_hot_lead       BOOLEAN DEFAULT FALSE
hot_lead_reason   TEXT
started_at        TIMESTAMPTZ
ended_at          TIMESTAMPTZ
called_at         TIMESTAMPTZ DEFAULT NOW()
```

### Relationship Diagram

```
companies 1─────N contacts
companies 1─────N campaigns
companies 1─────N documents
companies 1─────N document_chunks

documents 1─────N document_chunks

campaigns 1─────N call_logs
contacts  1─────N call_logs
```

---

## 5. Voice Call Pipeline (Critical)

This is the most important flow to understand for debugging.

### Outbound Call Flow (step by step)

```
1. FRONTEND calls POST /api/campaign/launch
        │
2. BACKEND fetches all 'pending' contacts for the company
        │
3. BACKEND creates campaign record (status='running')
        │
4. APScheduler queues calls with delays
   (call 1 at 0s, call 2 at 30s if 2/min, call 3 at 60s...)
        │
5. When timer fires → BACKEND calls Twilio API:
   twilio_client.calls.create(
     to='+919876543210',
     from_='+16802244688',
     url='https://ngrok.io/api/voice/inbound?company_id=xxx'
   )
        │
6. Twilio calls the customer's phone ☎️
        │
7. Customer answers → Twilio POSTs to /api/voice/inbound
        │
8. BACKEND returns TwiML XML with:
   - <Say> greeting (generated from PDF context via Gemini)
   - <Gather> waiting for customer speech
        │
9. Customer hears the greeting and speaks (Hindi/English)
        │
10. Twilio STT converts speech to text → POSTs to /api/voice/handle-speech
    with SpeechResult="mujhe clinic ke timings jaanna hai"
        │
11. BACKEND (THE RAG PIPELINE):
    a) Generates embedding of the query
    b) Searches pgvector for similar chunks
    c) Builds prompt with context
    d) Generates response via Gemini
        │
12. BACKEND returns TwiML with:
    - <Say> AI response (e.g., timings in Hindi)
    - <Gather> waiting for next customer speech
        │
13. Steps 9-12 repeat until:
    - Customer says "nahi chahiye" / "end call"
    - Customer asks for human (escalation detected)
    - Call drops / times out
        │
14. Twilio POSTs to /api/voice/call-status with final status
    → BACKEND updates call_logs, campaign counters, contact status
```

### Timing Notes (Important!)

| Step | Component | Typical Time |
|------|-----------|-------------|
| Greeting generation | Gemini | 1-3 seconds |
| Embedding + vector search | pgvector | 0.5-1 second |
| AI response generation | Gemini | 1-3 seconds |
| Twilio STT | Twilio | 1-2 seconds |
| Twilio TTS | Twilio | <0.5 seconds |

**Total round-trip:** ~3-6 seconds per exchange. The `<Gather timeout="15">` gives the customer 15 seconds to respond.

### Escalation Detection

The system detects these keywords (case-insensitive) and transfers to a human agent:
- "manager", "complaint", "angry", "not helping"
- "speak to human", "talk to a person", "agent"
- "supervisor", "escalate", "frustrated"

When detected → TwiML says "connecting to human agent" → frontend should show this in analytics.

---

## 6. RAG Pipeline (Document Q&A)

### How Documents Are Processed

```
PDF Upload
    │
    ▼
1. Extract text with pypdf
    │
    ▼
2. Split into chunks (500 words each, 50-word overlap)
   Chunk 1: words [0-500)
   Chunk 2: words [450-950)
   Chunk 3: words [900-1400)
   ... (overlap prevents info loss at boundaries)
    │
    ▼
3. For each chunk → generate 768-dim vector via Gemini Embedding-001
   (uses prefix="search_document" for document embedding)
    │
    ▼
4. Store in document_chunks table with vector
    │
    ▼
5. Document status → "ready"
```

### How Customer Questions Are Answered

```
Customer: "मुझे क्लिनिक के टाइमिंग्स जानना है"
    │
    ▼
1. Generate query embedding via Gemini Embedding-001
   (uses prefix="search_query" for query embedding)
    │
    ▼
2. Call match_chunks RPC:
   SELECT chunk_text
   FROM document_chunks
   WHERE company_id = <company_uuid>
   ORDER BY embedding <=> query_embedding  -- cosine distance
   LIMIT 5;
    │
    ▼
3. Get top 5 most similar chunks (with similarity score)
    │
    ▼
4. Build RAG prompt:
   "You are an outbound calling agent for Apna Clinic.
    Answer ONLY using the context below.
    
    CONTEXT:
    [1] Clinic Timings: Monday to Friday 9 AM to 7 PM...
    [2] Services: General consultation, Dental, Eye check-up...
    
    Customer asked: mujhe clinic ke timings jaanna hai"
    │
    ▼
5. Gemini generates response (strictly grounded in context)
    │
    ▼
6. Response converted to speech via Twilio <Say>
```

### Why This Works for Hindi

- Gemini Embedding-001 is **multilingual** — Hindi and English queries both work
- The embeddings are **semantic**, not keyword-based
- "timings" in Hindi and "timings" in English map to nearby vectors
- Response is generated in the same language as the query

---

## 7. Campaign Flow

### Launch → Complete Lifecycle

```
1. Frontend uploads contacts  ──→  POST /api/contacts/upload
   (CSV/Excel with phone numbers)
                             │
                             ▼
2. Frontend uploads PDFs     ──→  POST /api/documents/upload
   (clinic info, services, pricing)
                             │
                             ▼
3. Frontend launches campaign ──→  POST /api/campaign/launch
   {"calls_per_minute": 2}
                             │
                             ▼
4. APScheduler queues calls   ──→  Each call fires at its scheduled time
                             │
                             ▼
5. Calls placed via Twilio    ──→  Greeting → Conversation → End
                             │
                             ▼
6. Status updates flow back   ──→  POST /api/voice/call-status
                             │
                             ▼
7. Campaign auto-completes when:
   called >= total_contacts
   → campaign.status = "completed"
```

### Frontend Should Show

| Metric | Source | How |
|--------|--------|-----|
| Total contacts | `campaigns.total_contacts` | From `/api/company/get/{id}` |
| Called so far | `campaigns.called` | Poll or fetch after updates |
| Connected | `campaigns.connected` | Via campaign endpoint (to be built) |
| Hot leads | `campaigns.hot_leads` | Via campaign endpoint (to be built) |
| Call transcripts | `call_logs.transcript` | Via call-logs endpoint (to be built) |

---

## 8. Frontend Integration Guide

### Base URL Configuration

> **Important:** During development, `API_BASE` (your direct calls to FastAPI) and `PUBLIC_BASE` (the URL Twilio uses to reach your backend) are **different** because Twilio needs a publicly accessible URL. In production, they will be the **same**.

```js
// Development
const API_BASE = 'http://localhost:5050';   // Direct FastAPI (you call this)
const PUBLIC_BASE = 'https://xxx.ngrok-free.app';  // ngrok tunnel (Twilio calls this)

// Production
const API_BASE = 'https://api.callpilot.ai';
const PUBLIC_BASE = 'https://api.callpilot.ai';  // Same in production
```

### Authentication Setup

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'  // From Supabase Dashboard → Settings → API → anon public key (NOT the service_role key!)
);

// Login
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session.access_token;
}

// Logout
async function logout() {
  await supabase.auth.signOut();
}
```

### Suggested Page Structure

```
/login              → Supabase Auth login
/dashboard          → Overview: companies list, recent campaigns, call stats
/company/create     → Form: name, industry, mode, plan
/company/:id        → Company dashboard
  /company/:id/documents    → Upload PDFs, view chunks, test queries
  /company/:id/contacts     → Upload CSV, view contact list, import status
  /company/:id/campaigns    → Launch campaign, view progress, analytics
  /company/:id/calls        → Call logs, transcripts, outcomes
```

### API Call Helper

```js
async function apiCall(endpoint, options = {}) {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Examples:
// GET
const company = await apiCall('/api/company/get/xxx');

// POST with JSON
const campaign = await apiCall('/api/campaign/launch', {
  method: 'POST',
  body: JSON.stringify({
    company_id: 'xxx',
    campaign_name: 'Test',
    calls_per_minute: 2,
  }),
});

// POST with FormData (file upload)
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('company_id', companyId);

const result = await apiCall('/api/documents/upload', {
  method: 'POST',
  body: formData,
});
```

### Polling Strategy for Campaign Progress

```js
// Campaigns don't have real-time updates yet.
// Poll every 10-15 seconds for campaign progress:
async function pollCampaign(campaignId) {
  const interval = setInterval(async () => {
    const company = await apiCall(`/api/company/get/${companyId}`);
    // Check campaigns... (campaign endpoint TBD)
    if (campaign.status === 'completed') {
      clearInterval(interval);
      // Show completion
    }
  }, 15000);
}
```

---

## 9. Error Handling

### Standard Error Response Format

All errors return a JSON body with a `detail` field:

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | — |
| 400 | Bad Request | Invalid input, wrong file type, missing fields |
| 401 | Unauthorized | Missing JWT, expired token, invalid token |
| 403 | Forbidden | Not owner of company, inbound mode can't launch campaign |
| 404 | Not Found | Company doesn't exist |
| 500 | Server Error | DB failure, AI API error, file processing error |

### Handling on Frontend

```js
try {
  const result = await apiCall('/api/campaign/launch', { ... });
  // Success
} catch (err) {
  if (err.message.includes('403')) {
    // Show upgrade modal — "Upgrade to Outbound plan"
  } else if (err.message.includes('400')) {
    // Show validation error
  } else {
    // Show generic error toast
  }
}
```

---

## 10. Future Roadmap

### Phase 1 — Current (Done)
- ✅ FastAPI backend with all endpoints
- ✅ Twilio voice integration (inbound/outbound)
- ✅ RAG pipeline (PDF upload, chunking, embeddings, vector search)
- ✅ Campaign management (launch, schedule, track)
- ✅ Contact upload with phone validation
- ✅ JWT auth with Supabase
- ✅ Multilingual support (Hindi/English)

### Phase 2 — Next (To Be Built)
- 🔜 **Campaign analytics dashboard** — GET /api/campaign/{id}/stats endpoint (called, connected, hot_leads per campaign)
- 🔜 **Call logs viewer** — GET /api/call-logs?company_id=xxx endpoint with transcripts, duration, outcome
- 🔜 **Real-time campaign progress** — WebSocket or Server-Sent Events for live updates during campaign
- 🔜 **Contact management** — CRUD endpoints (edit, delete, filter contacts)
- 🔜 **Document management** — List, delete documents, re-index
- 🔜 **Company settings** — Update company profile, change mode/plan

### Phase 3 — Future
- 🔮 **Live call monitoring** — Dashboard shows active calls, transcripts in real-time
- 🔮 **Call recording** — Store audio recordings, playback in dashboard
- 🔮 **Analytics & reports** — Call success rates, response patterns, campaign ROI
- 🔮 **Multiple languages** — Support for Gujarati, Tamil, Bengali, Kannada
- 🔮 **Smart lead scoring** — AI analyzes conversations and scores leads
- 🔮 **SMS/WhatsApp follow-up** — Multi-channel outreach
- 🔮 **Custom AI prompts** — Per-company prompt templates
- 🔮 **Calendar booking** — AI can check availability and book appointments

### Integration Points the Frontend Team Should Build

1. **Login page** → Supabase Auth UI or custom login form
2. **Dashboard** → Company list with quick stats
3. **Company setup wizard** → Create company → Upload PDFs → Upload contacts
4. **Document manager** → Upload, preview, test queries
5. **Contact manager** → Upload CSV, view/sort/filter contacts
6. **Campaign launcher** → Configure and launch, view progress
7. **Call logs viewer** → Browse transcripts with search/filter
8. **Analytics dashboard** → Charts for campaign performance

---

## Quick Reference Cards

### 🔐 For Every Authenticated Request
```
Authorization: Bearer <supabase-access-token>
```

### 📄 File Upload Pattern
```js
const form = new FormData();
form.append('file', fileObject);     // PDF or CSV/Excel
form.append('company_id', companyId); // UUID string
```

### 📞 Call Analytics Data Model
```
campaigns:   total_contacts → called → connected → hot_leads
call_logs:   twilio_call_sid → status → transcript → duration_seconds
contacts:    phone → name → status (pending/called/failed)
```

### 🔍 Testing the RAG Pipeline
```bash
# Test a query directly (from backend directory)
curl -X POST http://localhost:5050/api/documents/query \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"company_id": "xxx", "question": "What are your prices?"}'
```

---

*This document was generated on May 15, 2025. For questions, contact the backend team.*
