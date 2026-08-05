-- Colle ce script dans Supabase SQL Editor (projet Jumua Time)
-- Table des accès Tilawa Tour accordés via l'encart homepage

create table if not exists public.beta_access (
  email      text primary key,
  source     text default 'homepage_encart',
  created_at timestamptz default now()
);

alter table public.beta_access enable row level security;

-- Lecture publique : Tilawa Tour peut vérifier si un email est autorisé
create policy "Vérification accès Tilawa Tour" on public.beta_access
  for select using (true);

-- Insertion publique : le formulaire homepage peut ajouter des emails
create policy "Inscription Tilawa Tour" on public.beta_access
  for insert with check (true);

-- Upsert (conflit ignoré silencieusement)
create policy "Upsert Tilawa Tour" on public.beta_access
  for update using (true);
