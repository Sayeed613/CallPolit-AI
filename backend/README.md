# CallPilot AI 📞🤖

**AI-powered inbound & outbound voice calling platform for Indian businesses.**  
CallPilot automates customer outreach and support calls with natural Hindi/English conversation, PDF-based knowledge retrieval, and campaign management.

---

## Architecture

```
Customer Phone 📱  ←→  Twilio ☁️  ←→  FastAPI 🚀  ←→  Gemini AI 🧠
                                        ↕
                                    Supabase 🗄️
                              (Postgres + pgvector)
```

### Key Components

| Layer | Tech | Role |
|-------|------|------|
| **Voice** | Twilio | Inbound/outbound calls, STT/TTS via Twilio `<Gather>` + `<Say>` |
| **AI** | Google Gemini 2.5 Flash Lite | Natural conversation, response generation |
| **Embeddings** | Gemini Embedding-001 | 768-dim vector embeddings for RAG |
| **Knowledge** | Supabase + pgvector | PDF storage, chunking, semantic search |
| **API** | FastAPI + Uvicorn | REST endpoints, async scheduling |
| **Auth** | Supabase Auth + JWT | User authentication, company ownership |

---

## Features

### 📄 Document Knowledge Base
- Upload PDFs → auto-chunked (500 words, 50-word overlap)
- Embedded into pgvector for semantic search
- AI answers **ONLY from retrieved chunks** — no hallucinations

### 📞 Outbound Campaigns
- Upload contacts via CSV/Excel
- Launch timed campaigns with configurable calls/minute
- Tracks: called, connected, hot leads, call transcripts
- Smart scheduling via APScheduler

### 🗣️ Multilingual Voice
- Hindi-first conversation with Hindi/English code-switching
- Natural `<Gather>` speech detection with Twilio
- Auto-detects customer language and responds accordingly

### 📊 Call Tracking
- Full call logs with transcripts and duration
- Call status webhooks (completed, failed, no-answer, busy)
- Campaign analytics (called, connected, hot leads)

### 🔐 Authentication
- Supabase Auth JWT validation
- Company-level ownership with mode gating (Inbound / Outbound / Both)

---

## Project Structure

```
backend/
├── main.py                     # FastAPI app entry point
├── requirements.txt            # Python dependencies
├── .gitignore                  # Git ignore rules
├── sql_migration.sql           # Supabase DB schema + pgvector setup
├── sql_relax_constraints.sql   # Relax NOT NULL constraints
│
├── config/
│   └── settings.py             # Environment config (from .env)
│
├── routers/
│   ├── health.py               # GET /health
│   ├── voice.py                # POST /api/voice/inbound, /handle-speech, /call-status
│   ├── documents.py            # POST /api/documents/upload, /query
│   ├── contacts.py             # POST /api/contacts/upload
│   ├── campaign.py             # POST /api/campaign/launch
│   ├── company.py              # POST /api/company/create, GET /api/company/get
│   └── __init__.py
│
├── services/
│   ├── groq_service.py         # Gemini AI + embedding client
│   ├── rag_service.py          # Chunking, RAG context building, escalation detection
│   ├── supabase_client.py      # Supabase DB helpers (companies, docs, contacts, campaigns, call logs)
│   ├── twilio_service.py       # Outbound call initiation
│   ├── sarvam_service.py       # Sarvam AI TTS (fallback)
│   ├── scheduler.py            # APScheduler singleton for campaign calls
│   ├── auth_middleware.py      # JWT authentication dependency
│   └── __init__.py
│
└── .env                        # ⚠️ Not committed — contains secrets
```

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- [Supabase](https://supabase.com) project with pgvector enabled
- [Twilio](https://twilio.com) account with a phone number
- [Google AI](https://ai.google.dev) API key (Gemini)
- [ngrok](https://ngrok.com) for local development

### 2. Setup

```bash
# Clone & enter
git clone https://github.com/Sayeed613/CallPolit-AI.git
cd CallPolit-AI/backend

# Virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys (see below)
```

### 3. Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

GOOGLE_API_KEY=your-gemini-api-key
SARVAM_API_KEY=your-sarvam-api-key  # Optional

PUBLIC_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### 4. Database Setup

Run `sql_migration.sql` in the Supabase SQL Editor. This creates:
- All tables (companies, contacts, campaigns, documents, document_chunks, call_logs)
- The `match_chunks` vector similarity search function
- Enables pgvector extension

Then run `sql_relax_constraints.sql` for relaxed column constraints.

### 5. Run Locally

```bash
# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 5050 --reload

# In another terminal, expose via ngrok
ngrok http 5050

# Update PUBLIC_BASE_URL in .env with the ngrok URL
```

### 6. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/documents/upload` | JWT | Upload PDF → chunk → embed |
| POST | `/api/documents/query` | JWT | Semantic search on documents |
| POST | `/api/contacts/upload` | JWT | Upload CSV/Excel contacts |
| POST | `/api/campaign/launch` | JWT | Launch outbound campaign |
| POST | `/api/company/create` | JWT | Create a company |
| GET | `/api/company/get/{id}` | JWT | Get company details |
| POST | `/api/voice/inbound` | No | Twilio inbound/outbound webhook |
| POST | `/api/voice/handle-speech` | No | Twilio speech gather callback |
| POST | `/api/voice/call-status` | No | Twilio call status webhook |

---

## How It Works

### Inbound/Outbound Call Flow

```
1. Twilio calls customer phone
        │
2. POST /api/voice/inbound (with company_id)
        │
3. Server generates greeting from PDF context via Gemini
        │
4. TwiML <Say> + <Gather> returned to Twilio
        │
5. Customer speaks (Hindi/English)
        │
6. POST /api/voice/handle-speech (with SpeechResult)
        │
7. Embed query → search pgvector → retrieve chunks
        │
8. Build RAG prompt → Gemini generates response
        │
9. TwiML <Say> + <Gather> returned (loop continues)
        │
10. POST /api/voice/call-status when call ends
```

### RAG Pipeline

```
Customer Question (Hindi/English)
        │
        ▼
Gemini Embedding-001 (768-dim)
        │
        ▼
Supabase match_chunks RPC (cosine similarity)
        │
        ▼
Top 5 document chunks retrieved
        │
        ▼
Context injected into prompt with strict grounding rules
        │
        ▼
Gemini 2.5 Flash Lite generates response
        │
        ▼
Twilio <Say> plays TTS to customer
```

---

## Campaign Management

1. **Upload contacts** via CSV/Excel (phone, name, email columns)
2. **Upload PDFs** with clinic/service info
3. **Launch campaign** with calls-per-minute config
4. APScheduler queues calls with appropriate delays
5. Each call: greet → converse → collect info → log outcome
6. Campaign auto-completes when all contacts are called

### Contact CSV Format

```csv
phone,name,email
9876543210,Rahul Sharma,rahul@example.com
+919876543210,Priya Patel,priya@example.com
```

---

## Database Schema

Main tables: `companies`, `contacts`, `campaigns`, `documents`, `document_chunks`, `call_logs`

Key: `document_chunks` has a `vector(768)` column for embeddings, queried via the `match_chunks()` PostgreSQL function which uses cosine distance (`<=>` operator).

---

## Tech Stack

- **Runtime:** Python 3.11+, FastAPI, Uvicorn
- **AI:** Google Gemini 2.5 Flash Lite (generation), Gemini Embedding-001 (embeddings)
- **Voice:** Twilio (calls, STT/TTS)
- **Database:** Supabase (Postgres + pgvector)
- **Scheduling:** APScheduler
- **Auth:** Supabase Auth (JWT)
- **File Parsing:** pypdf (PDFs), pandas + openpyxl (Excel/CSV)

---

## License

Private — Internal project
