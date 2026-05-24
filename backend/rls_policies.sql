-- ────────────────────────────────────────────────────────────
-- CallPilot AI — Row Level Security Policies
-- Run this AFTER complete_migration.sql
-- ────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Service role: full access to all tables
CREATE POLICY "service_role_all_companies" ON companies FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_contacts" ON contacts FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_campaigns" ON campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_documents" ON documents FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_call_logs" ON call_logs FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_document_chunks" ON document_chunks FOR ALL TO service_role USING (true);

-- Authenticated users: SELECT own company data
CREATE POLICY "user_select_companies" ON companies
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);

CREATE POLICY "user_select_contacts" ON contacts
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

CREATE POLICY "user_select_campaigns" ON campaigns
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

CREATE POLICY "user_select_documents" ON documents
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

CREATE POLICY "user_select_call_logs" ON call_logs
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()::text));

CREATE POLICY "user_select_document_chunks" ON document_chunks
    FOR SELECT TO authenticated
    USING (document_id IN (
        SELECT id FROM documents WHERE company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()::text
        )
    ));
