# CallPilot AI — Indian Market Research & Strategy

> **Document Purpose:** Competitor analysis, feature roadmap, pricing strategy, and growth recommendations for the Indian AI voice calling market.
> **Date:** July 2025
> **Target Customer:** Indian small businesses (clinics, dental practices, coaching centers, real estate agents, local service providers)

---

## 1. The Market Opportunity

### The Problem

- **85% of Indian small businesses** have no call center or automated calling system
- The owner/ receptionist personally answers calls → missed calls = lost revenue
- Existing solutions are built for **enterprises** (Exotel, Ozonetel, Knowlarity), not small clinics
- They charge **₹10,000–50,000/month** — out of range for a small business
- They require IT setup, training, and dedicated staff

### The Opportunity

| Stat | Implication |
|------|-------------|
| 1.2M+ clinics in India | Huge addressable market |
| 500K+ coaching centers | Similar need, different vertical |
| 85% have no call solution | Greenfield — no switching cost |
| Hindi + 22 regional languages | Language barrier is our moat |
| AI costs dropping 10x/year | Becomes viable for micro-businesses |

### Our Guiding Principle

> *"We're not competing with Exotel or Ozonetel. They chase ₹1 crore enterprise contracts. We're building for the clinic in Lajpat Nagar who's never had a call center. Our features should feel like magic to them, not like enterprise software."*

---

## 2. Competitor Landscape

### Tier 1: Enterprise Players (Not Direct Competitors)

| Company | Focus | Price Range | AI? | Hindi? | Best For |
|---------|-------|-------------|-----|--------|----------|
| **Exotel** | Enterprise cloud telephony | ₹10K–₹1L/month | ❌ Basic IVR | ✅ | Large businesses |
| **Knowlarity** | SME cloud telephony | ₹5K–₹30K/month | ❌ No AI | ✅ | Mid-size businesses |
| **Ozonetel** | Contact center platform | ₹8K–₹50K/month | ❌ Basic IVR | ✅ | Enterprises |
| **Ameyo** | Contact center software | ₹10K–₹40K/month | ❌ No AI | ✅ | BPOs, enterprises |

**Observation:** These are not our competitors. They serve a different market entirely — companies with 50+ employees and dedicated IT teams.

### Tier 2: CRM + Calling (Indirect Competitors)

| Company | Focus | Price Range | AI? | Hindi? | Best For |
|---------|-------|-------------|-----|--------|----------|
| **LeadSquared** | Sales CRM + calling | ₹3K–₹15K/month | 🔶 Limited | ❌ | Real estate, edu |
| **Zoho CRM** | CRM + telephony | ₹1K–₹10K/month | ❌ Basic | ❌ | SMBs |
| **Freshdesk Contact Center** | Helpdesk + calling | ₹2K–₹20K/month | ❌ Basic | ❌ | SMBs |

**Observation:** These are more affordable but require CRM setup. They're general-purpose, not purpose-built for Hindi voice calling with AI.

### Tier 3: AI Voice Bots (Our Actual Competitors Space)

| Company | Focus | Price Range | AI? | Hindi? | Best For |
|---------|-------|-------------|-----|--------|----------|
| **Skit.ai** | AI voice bots for enterprises | ₹50K+/month | ✅ Advanced | ✅ | Banks, insurance |
| **Yellow.ai** | Conversational AI | ₹30K+/month | ✅ Advanced | ✅ | Enterprises |
| **Voicezen** | AI voice | ₹20K+/month | ✅ Limited | ✅ | Mid-size |
| **👉 CallPilot** | AI voice for small biz | ₹3K–₹20K/month | ✅ Gemini AI | ✅ Hindi-first | **Clinics, small biz** |

### The Gap We Fill

| Dimension | Enterprise AI Bots | CallPilot |
|-----------|-------------------|-----------|
| Setup time | 2–4 weeks with a dedicated team | **10 minutes — upload PDF + upload contacts** |
| Cost | ₹30K–₹1L/month | **₹3K–₹20K/month** |
| Languages | English-first, Hindi as add-on | **Hindi-first, English is add-on** |
| Target user | IT manager at a bank | **Clinic owner who uses WhatsApp** |
| Onboarding | API integration, SDKs | **Web dashboard, 3-step setup** |
| Use case | Customer support automation | **Outbound calling + appointment booking** |

### Our Real Competition (Honest Take)

| # | Competitor | Why They Win | How We Beat Them |
|---|-----------|-------------|------------------|
| 1 | **"Do nothing"** (status quo) | Owner thinks: "My receptionist handles it" | Show cost: ₹15K/month vs ₹3K/month. Show missed calls |
| 2 | **Cheap no-AI IVR** (₹500/month) | Local vendors, cheap, existing relationship | Our AI actually talks. IVR is just "Press 1 for X". Not comparable |
| 3 | **Free WhatsApp broadcast** | Owner sends bulk WhatsApp messages | WhatsApp is read-only. Calls get answers. Better conversion |
| 4 | **Skit.ai / Yellow.ai** | Big brand, enterprise trust | Not our segment. They cost 10x and take 1 month to set up |

> **Framing:** "Our competition isn't Skit.ai — it's the clinic owner doing nothing because nothing affordable existed."

---

## 3. Feature Roadmap

### Phase 1.5 — Ship These Next (Weeks 2–4)

These are small, high-impact features:

#### 1. ✅ Structured Transcripts
- Store transcript as JSON array: `[{"role":"ai","text":"..."}, {"role":"customer","text":"..."}]`
- Frontend renders as chat bubbles (speech bubbles, different colors)
- **Why it matters:** Users love seeing what the AI said. Builds trust.

#### 2. 📅 Smart Appointment Booking
- AI detects: *"Mujhe appointment chahiye kal 4 baje"*
- AI asks: *"Kya aap kal 4 PM par aa sakte hain?"*
- On confirmation → store appointment in DB
- Future: Google Calendar sync
- **Why it matters:** This is the #1 reason clinics get calls.

#### 3. 🔄 Call-back Scheduling (Follow-ups)
- Conversation ends → AI asks: *"Call back tomorrow at 3 PM?"*
- Customer says yes → system auto-schedules follow-up call
- Column: `follow_up_at` in `call_logs`
- **Why it matters:** One call rarely closes. Follow-ups = revenue.

#### 4. 📊 Campaign Stats Endpoint
- `GET /api/campaign/{id}/stats` → Returns: called, connected, hot_leads, avg_duration
- Frontend: simple progress bar + mini-dashboard
- **Why it matters:** Users need to see results.

#### 5. 🔔 WhatsApp Follow-up (P0 Priority)
- **After a missed/no-answer call** → send WhatsApp message: *"Namaste, hum aapko call kar rahe the. Kya aap koi jaankari chahenge?"*
- **After a completed call** → send summary: *"Aapka appointment kal 4 PM confirm hai. Cancel ke liye yahan click kareen."*
- Use Twilio WhatsApp API or a 3rd-party service
- **Why P0?** Indians live on WhatsApp. Every missed call gets a second chance via WhatsApp. 2x engagement.
- **Future upgrade (Phase 3):** Full two-way conversational AI on WhatsApp

---

### Phase 1.5 — WhatsApp Distinction Clarified

| Feature | Phase | What It Does |
|---------|-------|-------------|
| **WhatsApp Follow-up** | ✅ Phase 1.5 | After a call (missed/completed), send a single WhatsApp message. **Notification only.** Simple, quick to build |
| **WhatsApp Conversational AI** | 🔮 Phase 3 | Full two-way conversation ON WhatsApp. Customer texts: *"Timings batao"* → AI answers from PDF. **Complex, requires webhook + state management** |

---

### Phase 2 — Build These Next (Months 1–2)

#### 1. 🎙️ Call Recording (Premium Feature)
- Record audio when customer says: *"Haan, record karo"* or call is marked hot lead
- Store in Supabase Storage: `recordings/{company_id}/{campaign_id}/{call_sid}.wav`
- Frontend: play button next to transcript
- **Only for Business Plan+**
- **Cost:** ~₹0.20/call for storage

#### 2. 🗣️ Sentiment Analysis on Transcripts
- After each call, run sentiment analysis on the transcript
- Label calls as: Positive / Neutral / Negative
- Show trend chart on dashboard: "Your patients are happy +12% this month"
- **Implementation:** Use Gemini to classify after call ends, store as `sentiment` column

#### 3. 📱 Multiple Language Detection
- AI detects what language the customer is speaking (Hindi, Hinglish, Gujarati, Tamil)
- Responds in the same language automatically
- **Implementation:** Current embeddings already work with any language. Just need to prompt the AI to detect and respond accordingly.

#### 4. 🔄 Call Transfer to Human (Escalate)
- Customer says: *"Mujhe doctor se baat karni hai"*
- AI detects escalation → triggers Twilio warm transfer
- Doctor's phone rings, AI briefs: *"Yeh patient Dr. Sharma se appointment confirm karna chahte hain"*
- **Implementation:** Twilio <Dial> verb to transfer

#### 5. 🕒 Smart Timing (Don't Call at 2 AM)
- Campaign respects time windows
- If a call is scheduled for 2 AM → auto-move to next day 9 AM
- Detect timezone from phone number (+91 = IST only, simple)
- **Why it matters:** Prevents bad user experience

---

### Phase 3 — Future Features (Months 3–6)

#### 1. 🤝 WhatsApp Business API Integration
- Two-way conversation on WhatsApp
- Customer can ask on WhatsApp: *"Timings batao"* → AI answers from PDF
- Appointment booking via WhatsApp
- **Why it matters:** Indians live on WhatsApp. This multiplies reach.

#### 2. 💳 Payment Collection via Call
- AI says: *"Aapka ₹500 ka balance baki hai. Kya aap ab payment karna chahenge?"*
- Customer says yes → Twilio collects DTMF (press 1 to pay)
- Integrate with Razorpay / PhonePe / PayU
- **Why it matters:** Money collection is a top use case for clinics and coaching centers.

#### 3. 📞 Inbound + IVR
- Customer calls the clinic's number → AI answers
- AI: *"Apna Clinic mein aapka swagat hai. Aap kis baare mein baat karna chahenge?"*
- Routes: Appointment → booking bot, Billing → info, Doctor → human transfer
- **Why it matters:** Reduces receptionist workload by 70%.

#### 4. 📈 AI Analytics Dashboard
- Weekly report: "This week AI handled 142 calls, booked 23 appointments, saved your receptionist 8 hours"
- Compare with last week
- **Why it matters:** Users stay when they see ROI.

#### 5. 📝 Custom Voice / Personality
- Clinic owner records 30 seconds of their voice → AI clones it
- Or: Select from presets (Friendly, Professional, Caring)
- **Implementation:** ElevenLabs voice cloning API
- **Why it matters:** Brand consistency.

---

## 4. Pricing Strategy

### Three Tiers (Monthly)

| Feature | Starter (₹2,999) | Growth (₹6,999) | Business (₹12,999) |
|---------|-----------------|-----------------|-------------------|
| Outbound calls/month | 500 | 2,500 | 10,000 |
| Inbound calls/month | 100 | 500 | 2,000 |
| PDF documents | 3 | 15 | Unlimited |
| Contacts | 500 | 5,000 | 50,000 |
| Campaigns | 2 active | 10 active | Unlimited |
| Languages | Hindi + English | Hindi + English | All Indian languages |
| Call recording | ❌ | ❌ | ✅ (last 30 days) |
| SMS follow-up | ❌ | ✅ | ✅ |
| Analytics | Basic | Detailed | Premium |
| Support | Email | Email + WhatsApp | Priority + Phone |
| Appointment booking | ❌ | ✅ | ✅ |
| Human transfer | ❌ | ❌ | ✅ |
| Extra call rate | ₹0.50/call | ₹0.35/call | ₹0.20/call |

### Annual Pricing (2 months free)
| Starter | Growth | Business |
|---------|--------|----------|
| ₹29,990/yr | ₹69,990/yr | ₹1,29,990/yr |

### Why This Pricing Works

- **Starter (₹2,999):** Cheaper than a part-time receptionist for 1 day. Easy upsell
- **Growth (₹6,999):** = 1 day of a receptionist's salary. Obvious value
- **Business (₹12,999):** Cheaper than the cheapest competitor (Knowlarity at ₹5K without AI). Massive value with AI

### Cost Analysis (Our Margins)

| Metric | Value |
|--------|-------|
| AI API cost per call (Gemini + Embedding) | ~₹0.15–0.30 |
| Twilio outbound call cost/min | ~₹0.65/min |
| Average call duration | ~2 min |
| **Total cost per call** | **~₹1.50–1.80** |
| Starter plan cost (500 calls) | ₹750–₹900 → **Revenue: ₹2,999** |
| Growth plan cost (2,500 calls) | ₹3,750–₹4,500 → **Revenue: ₹6,999** |
| Business plan cost (avg usage 2,000 calls) | ₹3,000–₹3,600 → **Revenue: ₹12,999** |

> **⚠️ Risk:** If a Business plan customer uses all 10,000 calls, our cost = ₹15,000–₹18,000, which means **loss on that customer**. Mitigation: Extra calls beyond 10,000 are charged at ₹0.20/call. Most customers will use 1,000–3,000 calls organically. Monitor usage weekly and auto-upsell heavy users.

#### Pay-Per-Use Option (For Hesitant First-Time Users)

Some clinic owners won't commit to ₹2,999/month. Offer a **pay-per-use** option:

| Model | Price | Best For |
|-------|-------|----------|
| **Pay-per-use** | ₹5/call | Trying it out, low volume (< 200 calls/month) |
| **Starter** | ₹2,999/month (500 calls) | Typical clinic (3–20 calls/day) |
| **Growth** | ₹6,999/month (2,500 calls) | Busy clinic (20–80 calls/day) |
| **Business** | ₹12,999/month (10,000 calls) | Multi-location, high volume |
| **Extra calls** | ₹0.20–₹0.50/call (depends on plan) | Overflow beyond plan limit |

**Why this works:**
- Pay-per-use users cost us ₹1.50/call, we charge ₹5/call = **70% margin**
- Converts easily: "Use 20 calls for free. If you like it, your first month is just ₹999."
- Low barrier: Clinic owner doesn't need to ask "permission" to spend ₹2,999

---

## 5. Customer Persona & Use Cases

### Primary Persona: Dr. Sharma — Clinic Owner

- **Age:** 35–55
- **Tech comfort:** Uses WhatsApp daily, might use Paytm
- **Pain point:** Receptionist costs ₹12,000–15,000/month. Missed calls after 6 PM.
- **Goal:** More patients, less missed calls, lower cost
- **Buying trigger:** "Meri receptionist ne 3 mahine mein 50 calls miss kiye"

### Use Case 1: Follow-up Calls for Clinics

**Scenario:** Patient visited clinic → needs follow-up after 7 days
- Upload contacts (name, phone, follow-up date)
- AI calls: *"Namaste [Patient Name], Apna Clinic se aapka follow-up hai. Aap kaise hain?"*
- Patient says fine → AI notes *"Called patient, they're fine"*
- Patient complains → AI notes *"Patient has fever, recommended to visit"*

### Use Case 2: Appointment Reminders

**Scenario:** Patient booked for tomorrow 10 AM
- AI calls: *"Namaste, kal 10 AM ko aapka appointment hai Apna Clinic mein. Kya aaloge?"*
- Patient says yes → done
- Patient says no → AI asks: *"Kya aap reschedule karna chahenge?"*

### Use Case 3: New Service / Campaign Announcement

**Scenario:** Clinic started dental checkup camp
- Upload 500 contacts
- AI calls: *"Apna Clinic naya dental checkup camp shuru kiya hai. Aap free checkup ke liye aa sakte hain."*
- Interested → AI books slot
- Not interested → *"Theek hai, dhanyavaad"* — marked as not interested, won't call again

### Use Case 4: Coaching Center — Fee Reminder

**Scenario:** Student hasn't paid fees
- AI calls: *"Namaste [Parent Name], [Center Name] se baat kar raha hoon. Aapke bachche ka fees ₹5,000 baki hai 15 June tak."*
- Parent: *"Haan, kal bhej dunga"* → AI logs promise date
- Parent: *"Mujhe extension chahiye"* → AI forwards to admin

### Use Case 5: Real Estate — Property Inquiry Follow-up

**Scenario:** Someone inquired about a property
- AI calls: *"Namaste, aapne [Project Name] ke baare mein puchha tha. Kya aap abhi bhi interested hain?"*
- Interested → AI books site visit
- Not interested → mark as cold

---

## 6. Growth Recommendations

### Distribution Channels (Ranked by ROI)

| Channel | Cost | Effort | Expected ROI | Notes |
|---------|------|--------|--------------|-------|
| **WhatsApp groups** (clinic owner groups) | Free | Medium | High | Join groups on Telegram + WhatsApp, offer free trial |
| **Direct outreach to clinics** | Low | High | Very High | Walk into clinics, show demo on phone. Convert on spot |
| **YouTube — Hindi tutorials** | Low | Medium | High | "AI se apni clinic ki calls automate karein" — search volume exists |
| **Google Ads (Hindi keywords)** | ₹20–50/click | Low | Medium | "clinic ke liye AI calling", "auto call system clinic" |
| **Clinic management software partners** | Revenue share | High | Very High | Partner with Practo, Clinikk, 1mg. They have the customer base |
| **Instagram Reels (Hindi + Hinglish)** | Free | Medium | Medium | Viral potential — "AI ne meri clinic ki 50 calls li" |

### Suggested Pilot Launch

1. **Pick 5 clinics near you**
2. Onboard them for **free for 1 month**
3. Help them upload their PDF and contacts
4. Collect video testimonials: *"Sirf 5 minute mein setup ho gaya. Roz 20 calls ho rahi hain."*
5. Use these testimonials as social proof for next 50 customers

### What Makes Us Different (Elevator Pitch)

> *"Most call center software costs ₹50,000/month and needs a dedicated IT team. We cost ₹3,000/month and take 5 minutes to set up. You upload your clinic's PDF and contact list — our AI calls your patients in Hindi, answers their questions, and books appointments. That's it."*

---

## 7. Technical Moats We're Building

| Feature | Competitors | Us | Moat Strength |
|---------|-------------|-----|----------------|
| **Hindi-first AI** | English-first, Hindi as add-on | Hindi from ground up | Strong — hard to replicate |
| **RAG with PDFs** | Require API integration | Upload PDF → AI reads it instantly | Medium — doable but tedious |
| **Zero setup** | 2–4 weeks with dedicated team | 10 minutes, no training | Strong — habit forming |
| **Campaign system** | Require CRM setup | Upload CSV → launch calls same day | Medium |
| **Cost** | ₹10K–₹1L/month | ₹3K–₹13K/month | Medium — can be undercut |

### Regulatory & Compliance (Critical for India)

> **⚠️ This is not optional. TRAI can block your outbound calling if you skip this.**

#### TRAI Regulations for Automated Voice Calls

| Requirement | Status | Action Needed |
|------------|--------|---------------|
| **Calling window** | ✅ Already handled | Only call 9 AM – 9 PM (standard business hours) |
| **DND (Do Not Disturb) compliance** | ❌ Not yet | Must check numbers against NDNC registry before calling. Register with TRAI as a telemarketer |
| **DLT registration** | ❌ Not yet | All commercial messages/calls in India require DLT header registration. ~₹5K–₹10K setup |
| **Consent record** | ❌ Not yet | Must store proof of consent for each call (customer agreed to be called). Our `call_logs` partially covers this |
| **Promotional vs Transactional** | ❌ Not yet | Appointment reminders = transactional (allowed). Campaign announcements = promotional (restricted hours) |

#### DPDP Act 2023 (Digital Personal Data Protection)

- Customer phone numbers = **personal data** under DPDP
- Must have: Consent record, data processing agreement, data deletion mechanism
- Penalties: Up to ₹250 crore for breaches
- **Action:** Add a consent checkbox during contact upload: "I confirm these customers have consented to be called"

#### Telecom Backup Plan

- **Primary:** Twilio (US-based, sometimes blocks +91 numbers)
- **Backup 1:** Plivo (India-friendly, good +91 support)
- **Backup 2:** Exotel (Indian telco, most compliant but most expensive)
- **Migrate strategy:** Abstract telephony behind an interface. Add a `telephony_provider` column in `companies` table.

#### Compliance Cost (One-time)

| Item | Cost |
|------|------|
| DLT registration | ₹5K–₹10K |
| Legal consultation (DPDP) | ₹25K–₹50K (one-time) |
| NDNC scrubbing (per number) | ~₹0.10/number via 3rd party APIs |
| **Total (one-time)** | ~₹35K–₹60K |

---

### 3b. Call Failure Handling (India-Specific)

Indian calls drop frequently. Here's the strategy:

| Scenario | Handling |
|----------|----------|
| **No answer (30s+)** | Auto-retry after 2 hours. Max 3 retries |
| **Busy tone** | Retry after 1 hour |
| **Call drops mid-conversation** | Save partial transcript. AI calls back: "Maaf karein, hamari call beech mein kat gayi thi. Kya aap baat jari rakhna chahenge?" |
| **Wrong number** | Customer: "Galat number hai" → Mark as invalid in contacts. Don't call again |
| **SIM switched off** | Retry after 4 hours. If still off → retry next day. If 3 days → mark as invalid |
| **Number on DND** | Mark and don't call. Remove from all campaigns |

**Implementation:** Add `retry_count`, `last_retry_at`, `invalid_reason` columns to `contacts` table.

---

### 3c. Feature Priority Reorder

Based on market research, here's the **revised priority**:

| Priority | Feature | Why Now |
|----------|---------|---------|
| P0 | Structured Transcripts | Builds trust. Quick win |
| **P0** | **WhatsApp Follow-up** | Indians live on WhatsApp. Missed call + WhatsApp follow-up = 2x engagement |
| P1 | Smart Appointment Booking | #1 reason clinics get calls |
| P1 | Call-back Scheduling | Follow-ups = revenue |
| P1 | Campaign Stats Endpoint | Users need to see results |
| P2 | Human Transfer (Escalate) | Without this, frustrated users churn |
| P2 | Smart Timing / Retry Logic | Prevents bad UX in India's network conditions |
| P2 | Sentiment Analysis | Understand user satisfaction |
| P3 | Call Recording | Premium feature, not essential |
| P3 | Multiple Language Detection | Important but Hindi covers 80%+ |
| P3 | Custom Voice | Nice-to-have |

> **WhatsApp is moved from Phase 3 to Phase 1.5.** Every missed call should get a WhatsApp follow-up automatically.

---

### Our Real Moat: The First 1,000 Clinics

Once we have 1,000 clinics using CallPilot:
- We have 1,000 reviews and testimonials
- We've handled 500,000+ calls — our prompt engineering is battle-tested
- We know exactly which PDF formats break and which prompts fail
- A competitor would need 6 months to catch up on data alone

---

## 8. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **AI latency too high for voice** | Medium | Very High | We already optimized: Gemini 2.5 Flash Lite (2–4s response). Acceptable for India |
| **Customer speaks a language AI doesn't understand** | Medium | High | Current embedding model handles Hindi/Hinglish. Add language detection in Phase 2 |
| **Twilio blocks Indian numbers** | Low | Very High | Use a domestic provider (Plivo, Exotel) as backup. Don't put all eggs in one basket |
| **Clinic owners don't use dashboard** | Medium | Medium | Keep it ultra-simple. Focus on WhatsApp reports. Don't force dashboard usage |
| **Pricing too high for target market** | Medium | High | Starter plan at ₹2,999 is already aggressive. Monitor churn. Consider ₹1,999 for first 100 customers |
| **Big player copies us** | High | Medium | Our lead in Hindi voice + clinic-specific features is narrow. Keep moving fast. Ship weekly. |

---

## 9. Key Metrics to Track

### User Acquisition
- [ ] Cost per lead (₹)
- [ ] Free trial sign-ups (per week)
- [ ] Trial → Paid conversion rate (%)

### Usage
- [ ] Calls made per day (per customer)
- [ ] Average call duration (seconds)
- [ ] Call connection rate (%)
- [ ] RAG retrieval success rate (%)

### Business
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Customer Acquisition Cost (CAC)
- [ ] Lifetime Value (LTV)
- [ ] Churn rate (monthly)
- [ ] Net Promoter Score (NPS) — ask: "Kya aap apne doosre clinic waale dost ko recommend karenge?"

### Technical
- [ ] AI response time (P95)
- [ ] Twilio webhook error rate (%)
- [ ] Vector search recall@5 (%)

---

## 10. What to Tell the Frontend Developer

> *"We're building an AI voice assistant for Indian clinics. The market is massive — 1.2M+ clinics, 85% with no call center. Our competitors charge ₹50,000/month for enterprise garbage. We charge ₹3,000/month and take 5 minutes to set up. Your frontend is what clinic owners see. It needs to be so simple that a 50-year-old clinic owner who only uses WhatsApp can upload a PDF and launch a campaign in 2 minutes."*

**Top 3 UI/UX Priorities:**
1. **3-step flow:** Upload PDF → Upload contacts → Launch campaign. That's it.
2. **Hindi-friendly:** Don't assume English. Use simple icons. Big buttons. Minimal text.
3. **Results visible:** Dashboard shows: "Today: 47 calls, 12 interested, 3 appointments booked"

---

*End of document. Last updated: July 2025.*
