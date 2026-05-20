-- ==============================================================
-- CallPilot AI — Relax NOT NULL constraints
-- Run this AFTER the main migration if tables already exist
-- with strict NOT NULL constraints that don't match the blueprint
-- ==============================================================

-- Call logs: Make FK columns nullable (inbound calls don't have campaign/contact)
ALTER TABLE call_logs ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE call_logs ALTER COLUMN contact_id DROP NOT NULL;
ALTER TABLE call_logs ALTER COLUMN duration_seconds SET DEFAULT 0;
ALTER TABLE call_logs ALTER COLUMN transcript SET DEFAULT '[]'::jsonb;
ALTER TABLE call_logs ALTER COLUMN collected_data SET DEFAULT '{}'::jsonb;
ALTER TABLE call_logs ALTER COLUMN started_at DROP NOT NULL;
ALTER TABLE call_logs ALTER COLUMN ended_at DROP NOT NULL;

-- Contacts: Make optional columns nullable or set defaults
ALTER TABLE contacts ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN email DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN city SET DEFAULT '';
ALTER TABLE contacts ALTER COLUMN qualification SET DEFAULT '';
ALTER TABLE contacts ALTER COLUMN custom_data SET DEFAULT '{}'::jsonb;

-- Campaigns: Set defaults for required columns
ALTER TABLE campaigns ALTER COLUMN language SET DEFAULT 'hi-IN';
ALTER TABLE campaigns ALTER COLUMN agent_brain_id DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN call_timing_start SET DEFAULT '09:00';
ALTER TABLE campaigns ALTER COLUMN call_timing_end SET DEFAULT '18:00';
