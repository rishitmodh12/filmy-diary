# Filmy Diary — backend

Express API server. Proxies TMDb, owns the recommendation logic, handles auth and saved watchlists/ratings.

## Setup

```bash
npm install
cp .env.example .env
```

Then open `.env` and fill in:
- `TMDB_TOKEN` — from themoviedb.org/settings/api (v4 Read Access Token). The server runs fine without this — film routes will just return a clear "not configured yet" error until you add it.
- `DATABASE_URL` — from your Supabase project (Settings → Database → Connection string). Run `src/db/schema.sql` against it once (Supabase dashboard → SQL Editor → paste → Run) before testing auth or watchlist routes.
- `JWT_SECRET` — any random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Run it

```bash
npm run dev
```

Server starts at `http://localhost:4000`. Visit `http://localhost:4000/health` first — it tells you exactly what's configured and what's still missing, so you always know what's left to wire up.

## Routes so far

| Method | Route | Needs auth? | Needs TMDb key? |
|---|---|---|---|
| GET | `/health` | No | No |
| POST | `/auth/signup` | No | No (needs DB) |
| POST | `/auth/login` | No | No (needs DB) |
| GET | `/films/search?q=` | No | Yes |
| GET | `/films/discover?country=&genreId=` | No | Yes |
| GET | `/films/genres` | No | Yes |
| GET | `/films/:id` | No | Yes |
| GET | `/films/recommend/mood?mood=` | No | Yes |
| GET | `/films/recommend/taste` | Yes | Yes |
| GET | `/user_films` | Yes | No |
| POST | `/user_films` | Yes | No |
| DELETE | `/user_films/:tmdbId` | Yes | No |

`POST /user_films` is an upsert — send `{ tmdbId, status, rating }` and it creates or updates in one call, so the frontend doesn't need to know whether a row already exists.

For protected routes, send `Authorization: Bearer <token>` using the token returned from signup/login.

## The recommendation engine

This lives in `src/services/recommend.js` and is the part of the project that's genuinely original — TMDb has no concept of "mood," so the mood taxonomy below is your own design work, not something pulled from the API.

**Valid moods:** Epic, Intense, Melancholic, Slow, Whimsical, Warm, Energetic, Tense, Dark, Nostalgic — each one maps to a combination of TMDb genres, optional keywords, a minimum vote-count floor (filters out obscure noise), and a sort strategy. Try `GET /films/recommend/mood?mood=Melancholic` once your TMDb key is in.

**Taste-graph** (`GET /films/recommend/taste`, requires login): pulls the logged-in user's films rated 4-5 stars, builds a weighted profile of their favorite genres and countries, then scores fresh TMDb candidates against that profile — genre match weighted higher than country match. Returns an empty list with a friendly message if the user hasn't rated anything yet, rather than erroring.

Both functions (`moodToDiscoverParams`, `buildTasteProfile`, `scoreForTaste`, `rankByTaste`) are pure — no network or database calls inside them — so they're fast to test and easy to reason about independently of TMDb being up or down.

## What's not built yet

- Country/genre "Explore" endpoint with curator's-picks overrides (Phase 4 in the main build guide describes this — straightforward `/discover` calls, lower priority than the two recommendation engines above)
- Rate limiting / input sanitization beyond basic checks — fine for a student project demo, worth hardening if this ever goes properly public.
