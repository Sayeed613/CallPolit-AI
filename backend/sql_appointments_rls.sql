-- ===============================================================
-- CallPilot AI — RLS Policies for Appointments Table
-- ===============================================================
-- Run this in Supabase SQL Editor after the appointments table exists.
-- Enables RLS (if not already) and creates policies for service_role
-- and authenticated users.

-- ─── 1. Ensure RLS is enabled ───────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ─── 2. Service role: full access (all operations) ──────────────
-- This ensures the backend (using service_role key) can do anything.
CREATE POLICY "service_role_all_appointments"
    ON appointments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ─── 3. Authenticated users: read-only for their own company ────
-- Allows frontend to list appointments for the user's company.
-- Cast auth.uid() to text because user_id in companies is text type.
CREATE POLICY "authenticated_select_appointments"
    ON appointments
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()::text
        )
    );

-- ─── 4. Authenticated users: update status for their own company ─
-- Allows frontend to mark appointments as completed/cancelled.
CREATE POLICY "authenticated_update_appointments"
    ON appointments
    FOR UPDATE
    TO authenticated
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()::text
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()::text
        )
    );
