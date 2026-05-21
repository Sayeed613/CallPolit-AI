-- ================================================================
-- CallPilot AI — Migration: Rename patient_* to customer_*
-- ================================================================
-- Run this in Supabase SQL Editor.
-- Step 1: Rename columns in the appointments table.

ALTER TABLE appointments
    RENAME COLUMN patient_name TO customer_name;

ALTER TABLE appointments
    RENAME COLUMN patient_phone TO customer_phone;

-- Update comments to reflect generic terminology
COMMENT ON COLUMN appointments.customer_name IS 'Name of the customer who booked this appointment';
COMMENT ON COLUMN appointments.customer_phone IS 'Phone number of the customer';
COMMENT ON COLUMN appointments.contact_id IS 'Link to contacts table if the customer exists there';
COMMENT ON TABLE appointments IS 'Appointments / bookings made via AI voice calls';
