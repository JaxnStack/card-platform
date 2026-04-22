-- PostgreSQL schema for Supabase multiplayer rooms

create extension if not exists pgcrypto;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  name text not null,
  game_type text not null,
  host_id text not null,
  players jsonb not null,
  state jsonb,
  status text not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure realtime updates are available for the rooms table.

-- Optional: row-level security can be enabled when authentication is configured.
-- alter table rooms enable row level security;
--
-- create policy "public select" on rooms for select using (true);
-- create policy "public insert" on rooms for insert with check (true);
-- create policy "player update" on rooms for update using (
--   auth.role() = 'authenticated' and (
--     exists (
--       select 1 from jsonb_array_elements(players) as player where player->> 'id' = auth.uid
--     )
--   )
-- );
