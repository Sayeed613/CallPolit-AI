-- ==============================================================
-- CallPilot AI — Supabase Database Migration
-- Run this entire script in the Supabase SQL Editor
-- ==============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Enable uuid generation
create extension if not exists "uuid-ossp";

-- ==============================================================
-- COMPANIES — Add missing columns if not present
-- ==============================================================
alter table companies
  add column if not exists industry text,
  add column if not exists created_at timestamptz default now();

-- ==============================================================
-- CONTACTS — Add missing columns if not present
-- ==============================================================
alter table contacts
  add column if not exists company_id uuid references companies(id),
  add column if not exists email text,
  add column if not exists created_at timestamptz default now();

-- ==============================================================
-- CAMPAIGNS — Add missing columns if not present
-- ==============================================================
alter table campaigns
  add column if not exists total_contacts int default 0,
  add column if not exists called int default 0,
  add column if not exists connected int default 0,
  add column if not exists hot_leads int default 0,
  add column if not exists launched_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists created_at timestamptz default now();

-- ==============================================================
-- DOCUMENTS — Create table
-- ==============================================================
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  file_name text,
  file_url text,
  extracted_text text,
  status text default 'processing',
  created_at timestamptz default now()
);

-- ==============================================================
-- DOCUMENT_CHUNKS — Create table with vector column
-- ==============================================================
create table if not exists document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id),
  company_id uuid references companies(id),
  chunk_index int,
  chunk_text text,
  embedding vector(768),
  created_at timestamptz default now()
);

-- ==============================================================
-- CALL_LOGS — Create table
-- ==============================================================
create table if not exists call_logs (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id),
  contact_id uuid references contacts(id),
  call_sid text,
  status text default 'initiated',
  outcome text,
  transcript text,
  duration_sec int default 0,
  is_hot_lead boolean default false,
  hot_lead_reason text,
  called_at timestamptz default now()
);

-- ==============================================================
-- MATCH_CHUNKS — Semantic search function
-- ==============================================================
create or replace function match_chunks(
  query_embedding vector(768),
  company_id_filter uuid,
  match_count int default 5
)
returns table (
  id uuid,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    id,
    chunk_text,
    1 - (embedding <=> query_embedding) as similarity
  from document_chunks
  where company_id = company_id_filter
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ==============================================================
-- Create "documents" Storage bucket (run in Storage settings too)
-- ==============================================================
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO NOTHING;
