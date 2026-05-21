-- ===============================================================
-- CallPilot AI — Migration: Retry, Callback, WhatsApp & Smart Timing
-- ===============================================================
-- Run this in Supabase SQL Editor
-- Date: July 2025

-- ─── 1. New columns on contacts table ─────────────────────────

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS best_call_time TIME;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS invalid_reason TEXT;

COMMENT ON COLUMN contacts.retry_count IS 'Number of times we have retried this contact';
COMMENT ON COLUMN contacts.last_retry_at IS 'Timestamp of the last retry attempt';
COMMENT ON COLUMN contacts.next_retry_at IS 'Scheduled time for the next retry';
COMMENT ON COLUMN contacts.best_call_time IS 'Learned best time to call this contact (populated after successful calls)';
COMMENT ON COLUMN contacts.invalid_reason IS 'Why contact was marked invalid (wrong_number, dnd, switched_off)';

-- Status values: pending, called, connected, unreachable, invalid, dnd
-- Note: status column already exists, just updating the allowed values

-- ─── 2. New columns on call_logs table ────────────────────────

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS whatsapp_followup_status TEXT DEFAULT 'none';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS whatsapp_followup_sent_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS needs_callback BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS retry_number INT DEFAULT 0;

COMMENT ON COLUMN call_logs.follow_up_at IS 'If customer requested callback, when to call back';
COMMENT ON COLUMN call_logs.whatsapp_followup_status IS 'none | pending | sent | failed';
COMMENT ON COLUMN call_logs.whatsapp_followup_sent_at IS 'When WhatsApp follow-up was sent';
COMMENT ON COLUMN call_logs.needs_callback IS 'Customer explicitly asked to be called back later';
COMMENT ON COLUMN call_logs.retry_number IS 'Which retry attempt this call was (0 = first try)';

-- ─── 3. New columns on campaigns table ────────────────────────

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS unreachable INT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS invalid_count INT DEFAULT 0;

COMMENT ON COLUMN campaigns.unreachable IS 'Number of contacts marked unreachable after max retries';
COMMENT ON COLUMN campaigns.invalid_count IS 'Number of contacts marked invalid (wrong number, DND)';

-- ─── 4. Index for efficient retry queries ─────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_next_retry
    ON contacts (next_retry_at)
    WHERE next_retry_at IS NOT NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_contacts_company_status
    ON contacts (company_id, status);

-- ─── 5. Function to get contacts needing retry ────────────────

CREATE OR REPLACE FUNCTION get_retry_eligible_contacts(target_company_id UUID)
RETURNS SETOF contacts
LANGUAGE SQL
STABLE
AS $$
    SELECT *
    FROM contacts
    WHERE company_id = target_company_id
      AND status = 'pending'
      AND retry_count < 3
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY next_retry_at ASC NULLS LAST
    LIMIT 50;
$$;

-- ─── 6. Function to get campaign stats ────────────────────────

CREATE OR REPLACE FUNCTION get_campaign_stats(target_campaign_id UUID)
RETURNS TABLE (
    campaign_id UUID,
    campaign_name TEXT,
    status TEXT,
    total_contacts INT,
    called INT,
    connected INT,
    hot_leads INT,
    unreachable INT,
    invalid_count INT,
    avg_duration NUMERIC,
    launched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        c.id,
        c.name,
        c.status,
        c.total_contacts,
        c.called,
        c.connected,
        c.hot_leads,
        c.unreachable,
        c.invalid_count,
        COALESCE((SELECT AVG(cl.duration_seconds) FROM call_logs cl WHERE cl.campaign_id = c.id AND cl.status = 'completed'), 0) AS avg_duration,
        c.launched_at,
        c.completed_at
    FROM campaigns c
    WHERE c.id = target_campaign_id;
$$;
