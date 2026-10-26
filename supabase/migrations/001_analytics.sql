-- Anonymized analytics only. Do not add columns for raw messages, raw URLs, or query values.

create table if not exists public.analysis_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('message', 'url')),
  risk_category text not null check (risk_category in ('low', 'medium', 'high', 'critical')),
  score_band text not null check (score_band in ('0-24', '25-49', '50-74', '75-100')),
  indicator_codes text[] not null default '{}',
  language text not null check (language in ('en', 'ta')),
  ai_used boolean not null default false,
  consent_to_ai boolean not null default false
);

create index if not exists analysis_events_created_at_idx
  on public.analysis_events (created_at desc);

alter table public.analysis_events enable row level security;
alter table public.analysis_events force row level security;

comment on table public.analysis_events is
  'Anonymized analysis metadata. The API must not insert message text, full URLs, or query values.';

-- Reserved for a future signed-in progress sync. The MVP stores quiz progress in the browser only.
create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  anonymous_id text,
  module_id text not null,
  completed boolean not null default false,
  score integer,
  updated_at timestamptz not null default now()
);

alter table public.learning_progress enable row level security;
alter table public.learning_progress force row level security;

comment on table public.learning_progress is
  'No policies are defined. The anon key cannot read or write. The service role bypasses RLS and must stay on the server.';
