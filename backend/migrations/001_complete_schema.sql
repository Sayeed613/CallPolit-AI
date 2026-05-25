-- CallPilot AI - Complete Database Migration
-- Includes all tables, indexes, RLS policies, and helper functions

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    industry TEXT DEFAULT '',
    mode TEXT DEFAULT 'outbound' CHECK (mode IN ('inbound', 'outbound', 'both')),
    verification_level INTEGER DEFAULT 1 CHECK (verification_level BETWEEN 1 AND 3),
    language_preference TEXT[] DEFAULT ARRAY['hindi', 'english'],
    escalation_phone TEXT DEFAULT '',
    business_hours_start TEXT DEFAULT '09:00',
    business_hours_end TEXT DEFAULT '18:00',
    after_hours_message TEXT DEFAULT 'Thank you for calling. Our business hours are 9 AM to 6 PM. Please call back during business hours.',
    twilio_phone_number TEXT DEFAULT '',
    twilio_account_sid TEXT DEFAULT '',
    twilio_auth_token TEXT DEFAULT '',
    api_key TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT DEFAULT '',
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    language TEXT DEFAULT 'hindi',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'vip')),
    is_vip BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    verification_level INTEGER DEFAULT 0,
    last_called TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),
    total_contacts INTEGER DEFAULT 0,
    calls_per_minute INTEGER DEFAULT 5,
    language TEXT DEFAULT 'auto',
    schedule_type TEXT DEFAULT 'now' CHECK (schedule_type IN ('now', 'later')),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    connected INTEGER DEFAULT 0,
    unreachable INTEGER DEFAULT 0,
    invalid_count INTEGER DEFAULT 0,
    hot_leads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CALL_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contact_name TEXT DEFAULT '',
    contact_phone TEXT NOT NULL,
    caller_phone TEXT DEFAULT '',
    twilio_call_sid TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'ringing', 'in-progress', 'completed', 'no-answer', 'busy', 'failed', 'missed')),
    duration REAL DEFAULT 0,
    direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
    language TEXT DEFAULT 'hindi',
    sentiment_score REAL DEFAULT 0.5,
    verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'failed')),
    transcript JSONB DEFAULT '[]',
    recording_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'application/pdf',
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    chunk_count INTEGER DEFAULT 0,
    storage_path TEXT DEFAULT '',
    storage_url TEXT DEFAULT '',
    error_message TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT_CHUNKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contact_name TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    title TEXT DEFAULT 'Appointment',
    description TEXT DEFAULT '',
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
    booked_by TEXT DEFAULT 'ai',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_company_id ON call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign_id ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_contact_id ON call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_twilio_sid ON call_logs(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_company_id ON document_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Increment campaign counter
CREATE OR REPLACE FUNCTION increment_campaign_counter(
    p_campaign_id UUID,
    p_field TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE campaigns SET %I = %I + $1, updated_at = NOW() WHERE id = $2', p_field, p_field)
    USING p_amount, p_campaign_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION match_document_chunks(
    p_company_id UUID,
    p_query_embedding vector(768),
    p_match_threshold FLOAT DEFAULT 0.3,
    p_match_count INT DEFAULT 5
) RETURNS TABLE(
    id UUID,
    document_id UUID,
    company_id UUID,
    chunk_index INT,
    content TEXT,
    similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id, dc.document_id, dc.company_id, dc.chunk_index, dc.content,
        1 - (dc.embedding <=> p_query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.company_id = p_company_id
      AND 1 - (dc.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY dc.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

-- Check and auto-complete campaign
CREATE OR REPLACE FUNCTION check_campaign_completion(
    p_campaign_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_campaign RECORD;
    v_total INTEGER;
BEGIN
    SELECT * INTO v_campaign FROM campaigns WHERE id = p_campaign_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    v_total := v_campaign.connected + v_campaign.unreachable + v_campaign.invalid_count;

    IF v_total >= v_campaign.total_contacts THEN
        UPDATE campaigns SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = p_campaign_id;
        RETURN TRUE;
    END IF;

    -- Safety valve: force complete if running > 24 hours and called >= total
    IF v_campaign.status = 'running' AND v_campaign.started_at IS NOT NULL
       AND EXTRACT(EPOCH FROM (NOW() - v_campaign.started_at)) > 86400
       AND v_total >= v_campaign.total_contacts THEN
        UPDATE campaigns SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = p_campaign_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Service role: full access to all tables
DROP POLICY IF EXISTS "service_role_all_companies" ON companies;
CREATE POLICY "service_role_all_companies" ON companies FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "service_role_all_contacts" ON contacts;
CREATE POLICY "service_role_all_contacts" ON contacts FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "service_role_all_campaigns" ON campaigns;
CREATE POLICY "service_role_all_campaigns" ON campaigns FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "service_role_all_call_logs" ON call_logs;
CREATE POLICY "service_role_all_call_logs" ON call_logs FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "service_role_all_documents" ON documents;
CREATE POLICY "service_role_all_documents" ON documents FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "service_role_all_document_chunks" ON document_chunks;
CREATE POLICY "service_role_all_document_chunks" ON document_chunks FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "service_role_all_appointments" ON appointments;
CREATE POLICY "service_role_all_appointments" ON appointments FOR ALL TO service_role USING (true);

-- Authenticated users: read own company data
DROP POLICY IF EXISTS "user_select_companies" ON companies;
CREATE POLICY "user_select_companies" ON companies FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "user_select_contacts" ON contacts;
CREATE POLICY "user_select_contacts" ON contacts FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_select_campaigns" ON campaigns;
CREATE POLICY "user_select_campaigns" ON campaigns FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_select_call_logs" ON call_logs;
CREATE POLICY "user_select_call_logs" ON call_logs FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_select_documents" ON documents;
CREATE POLICY "user_select_documents" ON documents FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_select_document_chunks" ON document_chunks;
CREATE POLICY "user_select_document_chunks" ON document_chunks FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_select_appointments" ON appointments;
CREATE POLICY "user_select_appointments" ON appointments FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_insert_companies" ON companies;
CREATE POLICY "user_insert_companies" ON companies FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "user_update_companies" ON companies;
CREATE POLICY "user_update_companies" ON companies FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "user_delete_companies" ON companies;
CREATE POLICY "user_delete_companies" ON companies FOR DELETE TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "user_all_contacts" ON contacts;
CREATE POLICY "user_all_contacts" ON contacts FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_all_campaigns" ON campaigns;
CREATE POLICY "user_all_campaigns" ON campaigns FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_all_call_logs" ON call_logs;
CREATE POLICY "user_all_call_logs" ON call_logs FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_all_documents" ON documents;
CREATE POLICY "user_all_documents" ON documents FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_all_document_chunks" ON document_chunks;
CREATE POLICY "user_all_document_chunks" ON document_chunks FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "user_all_appointments" ON appointments;
CREATE POLICY "user_all_appointments" ON appointments FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

INSERT INTO schema_version(version) VALUES('001') ON CONFLICT (version) DO NOTHING;
