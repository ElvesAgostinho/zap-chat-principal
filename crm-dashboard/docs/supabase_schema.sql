-- # Supabase Schema for Autonomous CRM

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. LEADS TABLE
create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  company text,
  linkedin_url text,
  status text default 'new' check (status in ('new', 'qualifying', 'nurturing', 'ready_for_human', 'closed', 'lost')),
  qualification_score int default 0,
  ai_summary text,
  last_interaction_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. INTERACTIONS TABLE (Omnichannel Logs)
create table interactions (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'linkedin', 'call', 'system')),
  content text not null,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  direction text not null check (direction in ('inbound', 'outbound')),
  created_at timestamp with time zone default now()
);

-- 3. AI AGENT SETTINGS
create table ai_settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value text not null,
  description text,
  updated_at timestamp with time zone default now()
);

-- Indices for performance
create index idx_leads_status on leads(status);
create index idx_leads_email on leads(email);
create index idx_interactions_lead_id on interactions(lead_id);

-- Updated at triggers function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_leads_updated_at before update on leads for each row execute procedure update_updated_at_column();
