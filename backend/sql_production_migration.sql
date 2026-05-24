-- ============================================================
-- CallPilot AI - Production Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Atomic counter function for campaign race condition fix
CREATE OR REPLACE FUNCTION increment_counter(
    table_name text,
    column_name text,
    row_id uuid
) RETURNS void AS $$
BEGIN
    EXECUTE format(
      'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
      table_name, column_name, column_name
    ) USING row_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Customer data fields for contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pan_last4 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS aadhaar_last4 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS policy_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS previous_interactions JSONB DEFAULT '[]';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS open_tickets JSONB DEFAULT '[]';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS outstanding_dues NUMERIC DEFAULT 0;

-- 3. Company verification settings
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_level INT DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'general';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'hi-IN';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS escalation_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_hours_start TEXT DEFAULT '09:00';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_hours_end TEXT DEFAULT '21:00';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS after_hours_message TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ai_persona_name TEXT DEFAULT 'CallPilot';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS greeting_message TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_call_duration INT DEFAULT 600;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS silence_timeout INT DEFAULT 15;

-- 4. Verification sessions table
CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    phone TEXT NOT NULL,
    session_token TEXT NOT NULL,
    otp TEXT,
    otp_expires_at TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    locked BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    verification_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes'
);

-- 5. Live call sessions table
CREATE TABLE IF NOT EXISTS live_call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    call_sid TEXT NOT NULL,
    caller_phone TEXT,
    caller_name TEXT,
    status TEXT DEFAULT 'active',
    duration INT DEFAULT 0,
    language TEXT DEFAULT 'hi-IN',
    sentiment TEXT DEFAULT 'neutral',
    ai_confidence FLOAT DEFAULT 0.0,
    transcript TEXT DEFAULT '',
    verification_status TEXT DEFAULT 'not_verified',
    is_human_handling BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 6. Follow-up messages table
CREATE TABLE IF NOT EXISTS follow_up_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    call_sid TEXT,
    channel TEXT NOT NULL, -- 'sms', 'whatsapp'
    message_type TEXT NOT NULL, -- 'summary', 'missed_call', 'callback_confirmation'
    message_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS on new tables
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_messages ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for new tables
CREATE POLICY "Users can view their own company verification sessions"
    ON verification_sessions FOR SELECT
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own live call sessions"
    ON live_call_sessions FOR SELECT
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own follow-up messages"
    ON follow_up_messages FOR SELECT
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
