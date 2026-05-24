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

-- 4. Verification sessions table
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

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_verification_sessions_phone 
    ON verification_sessions(phone, company_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_active 
    ON verification_sessions(company_id, phone, created_at DESC);

-- 5. Update document_chunks embedding to use vector type
-- Run this after verifying the pgvector extension is enabled
DO $$
BEGIN
    -- Only attempt if pgvector extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768) USING embedding::vector;
    END IF;
END
$$;

-- 6. Create function to match chunks by vector similarity
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(768),
    company_id_filter UUID,
    match_count INT DEFAULT 5
) RETURNS TABLE(
    id UUID,
    chunk_text TEXT,
    chunk_index INT,
    document_id UUID,
    company_id UUID,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.chunk_text,
        dc.chunk_index,
        dc.document_id,
        dc.company_id,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.company_id = company_id_filter
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
