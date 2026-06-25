-- Tables V1 : professionals + services
-- À exécuter dans Supabase SQL Editor une fois .env.local rempli.

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  job text not null,
  category text not null,
  bio text,
  avatar_url text,
  rating numeric default 0,
  reviews integer default 0,
  distance_km numeric default 0,
  availability text default 'now',
  price integer default 0,
  verified boolean default false,
  at_home boolean default true,
  specialty text,
  experience integer default 0,
  x numeric default 50,
  y numeric default 50,
  created_at timestamp with time zone default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid references professionals(id) on delete cascade,
  name text not null,
  duration integer not null,
  price integer not null,
  created_at timestamp with time zone default now()
);

-- Données de test
insert into professionals
(name, job, category, bio, rating, reviews, distance_km, availability, price, verified, at_home, specialty, experience, x, y)
values
('Camille Bernard', 'Coiffeuse à domicile', 'Coiffure', 'Je me déplace chez vous avec tout le matériel nécessaire.', 4.9, 127, 0.8, 'now', 35, true, true, 'Couleur & balayage', 8, 52, 48),
('Julie Lemoine', 'Esthéticienne', 'Beauté', 'Soins visage, épilation et manucure à domicile.', 4.9, 63, 1.4, '15:00', 35, true, true, 'Soins visage & manucure', 5, 78, 62)
on conflict do nothing;

-- Lecture publique (anon key)
alter table professionals enable row level security;
alter table services enable row level security;

create policy "Public read professionals"
  on professionals for select
  using (true);

create policy "Public read services"
  on services for select
  using (true);
