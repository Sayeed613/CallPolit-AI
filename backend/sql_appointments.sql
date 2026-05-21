-- ===============================================================
-- CallPilot AI — Migration: Smart Appointment Booking
-- ===============================================================
-- Run this in Supabase SQL Editor
-- Date: July 2025

-- ─── 1. Appointments table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    contact_id UUID REFERENCES contacts(id),
    call_log_id UUID REFERENCES call_logs(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    source TEXT NOT NULL DEFAULT 'voice_call',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE appointments IS 'Appointments / bookings made via AI voice calls';
COMMENT ON COLUMN appointments.company_id IS 'The company this appointment belongs to';
COMMENT ON COLUMN appointments.contact_id IS 'Link to contacts table if the customer exists there';
COMMENT ON COLUMN appointments.call_log_id IS 'Link to the call during which this was booked';
COMMENT ON COLUMN appointments.customer_name IS 'Name of the customer who booked this appointment';
COMMENT ON COLUMN appointments.customer_phone IS 'Phone number of the customer';
COMMENT ON COLUMN appointments.status IS 'scheduled | confirmed | completed | cancelled | no_show';
COMMENT ON COLUMN appointments.source IS 'voice_call | manual | whatsapp';
COMMENT ON COLUMN appointments.notes IS 'Any notes from the conversation (reason for visit, etc.)';

-- ─── 2. Indexes for common queries ─────────────────────────────

CREATE INDEX IF NOT EXISTS idx_appointments_company_date
    ON appointments (company_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_status
    ON appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointments_created_at
    ON appointments (created_at);

-- ─── 3. Function to auto-update updated_at ─────────────────────

CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();
