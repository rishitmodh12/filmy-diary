-- Run this once against your Supabase Postgres database
-- (Supabase dashboard -> SQL Editor -> paste this -> Run)

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamp default now()
);

create table if not exists user_films (
  user_id uuid references users(id) on delete cascade,
  tmdb_id integer not null,
  status text check (status in ('watched', 'watchlist')),
  rating integer check (rating between 1 and 5),
  updated_at timestamp default now(),
  primary key (user_id, tmdb_id)
);
