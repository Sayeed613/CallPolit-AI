-- =============================================================================
-- CallPilot AI — Complete Database Migration
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- EXISTING TABLES — Ensure they exist with all required columns
-- =============================================================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT DEFAULT 'general',
    mode TEXT DEFAULT 'both',
    plan TEXT DEFAULT 'free',
    twilio_phone TEXT,
    verification_level INT DEFAULT 1,
    industry_type TEXT DEFAULT 'general',
    language_preference TEXT DEFAULT 'hi-IN',
    escalation_phone TEXT,
    business_hours_start TEXT DEFAULT '09:00',
    business_hours_end TEXT DEFAULT '21:00',
    after_hours_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    campaign_id UUID,
    name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'pending',
    pan_last4 TEXT,
    aadhaar_last4 TEXT,
    date_of_birth DATE,
    account_number TEXT,
    policy_number TEXT,
    customer_id TEXT,
    kyc_status TEXT DEFAULT 'pending',
    risk_score INT DEFAULT 0,
    is_vip BOOLEAN DEFAULT FALSE,
    previous_interactions JSONB DEFAULT '[]',
    open_tickets JSONB DEFAULT '[]',
    outstanding_dues NUMERIC DEFAULT 0,
    mothers_maiden TEXT,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    invalid_reason TEXT,
    best_call_time TEXT,
    last_called_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'processing',
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks (for vector search)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    total_contacts INT DEFAULT 0,
    called INT DEFAULT 0,
    connected INT DEFAULT 0,
    hot_leads INT DEFAULT 0,
    unreachable INT DEFAULT 0,
    invalid_count INT DEFAULT 0,
    language TEXT DEFAULT 'hi-IN',
    call_timing_start TEXT DEFAULT '09:00',
    call_timing_end TEXT DEFAULT '18:00',
    calls_per_minute INT DEFAULT 5,
    launched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    campaign_id UUID,
    contact_id UUID,
    twilio_call_sid TEXT,
    from_number TEXT,
    to_number TEXT,
    direction TEXT DEFAULT 'outbound',
    status TEXT DEFAULT 'initiated',
    duration_seconds INT DEFAULT 0,
    transcript JSONB DEFAULT '[]',
    collected_data JSONB DEFAULT '{}',
    needs_callback BOOLEAN DEFAULT FALSE,
    follow_up_at TIMESTAMPTZ,
    whatsapp_followup_status TEXT DEFAULT 'none',
    retry_number INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID,
    call_log_id UUID,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'scheduled',
    source TEXT DEFAULT 'voice_call',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- NEW TABLES
-- =============================================================================

-- Verification sessions
CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    session_token TEXT NOT NULL,
    otp TEXT,
    otp_verified BOOLEAN DEFAULT FALSE,
    otp_expires_at TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    locked BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    verification_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes'
);

-- =============================================================================
-- ADD NEW COLUMNS TO EXISTING TABLES
-- =============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_level INT DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'general';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'hi-IN';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS escalation_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_hours_start TEXT DEFAULT '09:00';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_hours_end TEXT DEFAULT '21:00';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS after_hours_message TEXT;

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
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mothers_maiden TEXT;

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS from_number TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS to_number TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';

-- =============================================================================
-- ATOMIC COUNTER FUNCTION (fixes race condition in campaign progression)
-- =============================================================================

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

-- =============================================================================
-- VECTOR SEARCH FUNCTION (for semantic chunk matching)
-- =============================================================================

CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding VECTOR(768),
    company_id_filter UUID,
    match_count INT DEFAULT 5
) RETURNS TABLE(
    id UUID,
    document_id UUID,
    chunk_text TEXT,
    chunk_index INT,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_text,
        dc.chunk_index,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.company_id = company_id_filter
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_twilio_sid ON call_logs(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_company ON call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_company ON document_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_phone ON verification_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_company ON verification_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
