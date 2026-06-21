# Filmy Diary — build guide

A world cinema tracking and recommendation app. Three-person team, real movie data, real recommendation logic, deployed and demoable by the end.

**Team split**
- **You (Rishit):** backend, TMDb integration, recommendation engine, deployment
- **Friend A + Friend B:** frontend — split by feature area (see Week 2 below)

---

## Phase 0 — Get your TMDb API key (do this first, today)

TMDb (The Movie Database) is the standard free movie data API portfolio projects use. It's free forever for non-commercial use.

1. Go to themoviedb.org and create an account, verify your email
2. Click your profile icon (top right) → Settings → API
3. Click "Create" under Request an API Key → choose **Developer**
4. Accept the terms of use
5. Fill in the application form:
   - **Application name:** Filmy Diary
   - **Application URL:** you don't need a live site yet — use your GitHub profile URL or `https://github.com/yourusername`
   - **Application summary:** one sentence is fine, e.g. "A student project for tracking and recommending world cinema"
6. Submit. You'll get two credentials — save both somewhere safe (not committed to GitHub):
   - **API Key (v3 auth)** — a short string, used as a query parameter
   - **API Read Access Token (v4 auth)** — a long token, used as a Bearer header

Use the v4 Read Access Token for new projects — it's the modern method and what the examples below use.

**Test it works**, paste into your browser:
```
https://api.themoviedb.org/3/movie/550?api_key=YOUR_V3_KEY
```
You should see JSON for the movie Fight Club. If you see real data back, you're set.

---

## Phase 1 — Decide your stack

Given a 3-person student team going for a polished portfolio piece, here's the stack I'd recommend and why:

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) | Your friends likely already know it; fast dev server |
| Styling | Tailwind CSS | Fast to build with, looks clean by default, easy to split work without style conflicts |
| Backend | Node.js + Express (thin layer) | Keeps your TMDb key off the client, lets you add your own recommendation logic on top of raw TMDb data |
| Auth | Your own, with bcrypt + JWT | You asked for simple username + password, no email or OAuth — see Phase 5.5. Simpler than configuring a third-party auth system for this exact need |
| Database | Supabase (Postgres only, not Supabase Auth) | Free tier, gives you a hosted Postgres database with zero setup; you're just using it as a database, not its auth product |
| Hosting | Vercel (frontend) + Render or Railway (backend) | Both have generous free tiers and deploy straight from GitHub |

**Why not call TMDb directly from the frontend?** Two reasons. First, your API key would be exposed in browser network requests — fine for a pure demo, risky for anything you'll actually share publicly. Second, and more important for your portfolio story: routing through your own backend is where you add the actually interesting part — the recommendation engine, caching, and combining TMDb data with your users' ratings. That backend logic is what makes this "your" project and not just a TMDb wrapper.

---

## Phase 2 — Project structure

```
filmy-diary/
  client/              React frontend (Friend A + Friend B)
    src/
      pages/
        Library.jsx
        ForYou.jsx
        Explore.jsx
        MyList.jsx
      components/
        FilmCard.jsx
        StarRating.jsx
        FilmDetail.jsx
      api/
        client.js       calls YOUR backend, never TMDb directly
  server/              Node/Express backend (you)
    src/
      routes/
        films.js         search, details, genres — proxies + shapes TMDb data
        recommend.js      your recommendation logic lives here
        auth.js           signup/login, see Phase 5.5
        users.js          watchlist, watched, ratings
      middleware/
        auth.js           requireAuth — verifies JWT on protected routes
      services/
        tmdb.js           all TMDb API calls isolated here
      db/
        schema.sql
    .env                 TMDB_TOKEN, DATABASE_URL, JWT_SECRET — never committed
```

Keeping `tmdb.js` as the only file that talks to TMDb means if TMDb's API ever changes, or you want to swap in a second data source later, you change one file.

---

## Phase 3 — Your first backend endpoint

This is the core pattern you'll repeat: backend calls TMDb, shapes the response, frontend never sees TMDb directly.

`server/src/services/tmdb.js`
```javascript
const TMDB_BASE = "https://api.themoviedb.org/3";
const TOKEN = process.env.TMDB_TOKEN; // your v4 Read Access Token

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
  return res.json();
}

async function searchMovies(query, page = 1) {
  return tmdbFetch("/search/movie", { query, page, include_adult: false });
}

async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: "credits,keywords" });
}

async function discoverByCountryAndGenre({ country, genreId, page = 1 }) {
  return tmdbFetch("/discover/movie", {
    with_origin_country: country,
    with_genres: genreId,
    sort_by: "vote_average.desc",
    "vote_count.gte": 100, // filters out obscure/low-data titles
    page
  });
}

module.exports = { searchMovies, getMovieDetails, discoverByCountryAndGenre };
```

`server/src/routes/films.js`
```javascript
const express = require("express");
const router = express.Router();
const tmdb = require("../services/tmdb");

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const data = await tmdb.searchMovies(q);
  res.json(data.results.map(shapeFilm));
});

router.get("/:id", async (req, res) => {
  const data = await tmdb.getMovieDetails(req.params.id);
  res.json(shapeFilm(data));
});

function shapeFilm(raw) {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.release_date?.slice(0, 4),
    poster: raw.poster_path ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` : null,
    overview: raw.overview,
    rating: raw.vote_average,
    genres: raw.genres?.map(g => g.name) || [],
    runtime: raw.runtime,
  };
}

module.exports = router;
```

This `shapeFilm` function is important — it's the single place that converts TMDb's raw, sprawling response into the clean shape your frontend actually wants. Your friends never need to learn TMDb's response format; they just consume your shaped API.

---

## Phase 4 — The recommendation engine (this is your centerpiece) — ✅ built

This is now fully built and unit-tested, in `src/services/recommend.js` and `src/routes/recommend.js` in your backend zip. Here's what's actually in there:

**1. Mood-based** — TMDb doesn't have a "mood" field, so this is genuinely your own IP. `recommend.js` defines a `MOOD_MAP` with ten moods (Epic, Intense, Melancholic, Slow, Whimsical, Warm, Energetic, Tense, Dark, Nostalgic), each mapped to a combination of TMDb genre IDs, optional keyword IDs for finer signal, a minimum vote-count floor, and a sort strategy. `moodToDiscoverParams(mood)` turns a mood name into ready-to-use `/discover/movie` query params. This is worth highlighting in your portfolio write-up specifically because it's not something you could get "for free" from the API — it's a layer of taste you designed and can defend the choices behind.

**2. Taste-graph** — real collaborative-filtering-adjacent logic. `GET /films/recommend/taste` (requires login) pulls the logged-in user's 4-5 star ratings from your own database, builds a weighted profile of their favorite genres and countries via `buildTasteProfile()`, then scores fresh TMDb candidates against that profile via `scoreForTaste()` and `rankByTaste()` — genre match weighted 2x, country match 1.5x, anything already rated or listed excluded automatically.

**3. Country/genre explorer** — not yet built (lower priority than the two above). Will be straightforward `/discover/movie` calls filtered by `with_origin_country` and `with_genres`. This is also where your personal curation can shine later: you can hand-pick a "curator's picks" override list per country, the same instinct you used building the cinema guide earlier, so the explorer isn't purely algorithmic.

The scoring logic, tested directly against sample data:
```javascript
function scoreForTaste(candidate, tasteProfile) {
  let score = 0;
  (candidate.genres || []).forEach(g => {
    score += (tasteProfile.genreCounts[g] || 0) * 2;
  });
  if (candidate.country) {
    score += (tasteProfile.countryCounts[candidate.country] || 0) * 1.5;
  }
  return score;
}
```
A user who rated a Japanese drama-romance 5 stars and an Indian drama 4 stars will see a Japanese drama-romance candidate score highest, an Indian drama score second, and an unrelated American comedy excluded entirely — confirmed with real test data when this was built.

---

## Phase 4.5 — Set up Supabase (do this now, doesn't need TMDb)

This is fully independent of TMDb being blocked — do it whenever, including right now.

1. Go to supabase.com → **Start your project** → sign in with GitHub (easiest, no separate password to manage)
2. Click **New project**
   - **Name:** `filmy-diary`
   - **Database password:** generate a strong one and **save it somewhere safe** — you'll need it once for the connection string, then never type it manually again
   - **Region:** pick whichever is closest (Singapore or Mumbai if available — lower latency for testing from India)
   - **Plan:** Free
3. Wait ~2 minutes for the project to provision
4. Once it's ready, go to **SQL Editor** in the left sidebar → **New query**
5. Paste the entire contents of `src/db/schema.sql` from the backend zip → click **Run**
   - This creates your `users` and `user_films` tables in one shot
6. Go to **Project Settings** (gear icon) → **Database** → scroll to **Connection string** → copy the **URI** format one
   - It looks like `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-x-xxxx.pooler.supabase.com:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with the database password from step 2
7. Paste that full string into your backend's `.env` as `DATABASE_URL`

**Test it works:**
```bash
npm run dev
```
Then visit `http://localhost:4000/health` — `dbConfigured` should say `true`. Try signing up a test user:
```bash
curl -X POST http://localhost:4000/auth/signup -H "Content-Type: application/json" -d '{"username":"test","password":"test123"}'
```
If you get back a token and user object, your database is fully wired up.

**One thing worth knowing, not a blocker:** free-tier Supabase projects pause automatically after a week with zero activity (exams, holidays, etc.) — your data isn't deleted, you just log back into the dashboard and click unpause. Worth remembering before a demo day if the project's been untouched for a while.

---

## Phase 5 — Database schema reference

You only need to store what TMDb doesn't: user accounts and their relationship to films. This is exactly what `src/db/schema.sql` (already in your backend zip, and already run in Phase 4.5 above) creates:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamp default now()
);

create table user_films (
  user_id uuid references users(id) on delete cascade,
  tmdb_id integer not null,
  status text check (status in ('watched', 'watchlist')),
  rating integer check (rating between 1 and 5),
  updated_at timestamp default now(),
  primary key (user_id, tmdb_id)
);
```

Notice you're not duplicating TMDb's movie data in your own database — you just store the `tmdb_id` and look up details live (with caching, see below). This keeps your database tiny and avoids the data going stale.

---

## Phase 5.5 — Simple username + password login (no email, no OAuth)

You wanted the lightest possible login: a name and a password, nothing else. This is already fully built in your backend zip — `src/routes/auth.js` and `src/middleware/auth.js` — using `bcryptjs` for password hashing (a pure-JS alternative to `bcrypt` that avoids native-compile issues on free hosting tiers) and `jsonwebtoken` for sessions.

Worth understanding *why* this approach over Supabase's built-in auth product: Supabase Auth is built around email as the primary identity field, with email confirmation on by default — more setup than you need for "just a username and password." Rolling your own with a `users` table is simpler here, and you'll fully understand every piece of it, which is a genuine plus to be able to speak to in a portfolio interview.

**The two endpoints you have, ready to use:**
- `POST /auth/signup` — body `{ username, password }`, returns `{ token, user }`
- `POST /auth/login` — same shape

**On the frontend**, whoever builds the login form needs just two fetch calls:
```javascript
async function signup(username, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) localStorage.setItem("token", data.token);
  return data;
}

async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) localStorage.setItem("token", data.token);
  return data;
}
```
Then attach `Authorization: Bearer ${token}` to any request that needs to know who the user is (this is already wired up server-side via `requireAuth` on the `/user_films` routes).

**Two things worth knowing, not because they'll trip you up at student-project scale, but because they're good to be able to speak to:** passwords are never stored in plain text (bcryptjs handles that), and a username-only system means there's no password reset flow possible since you have no way to contact the person — if that's ever a real concern later, an email field would need to come back. For a portfolio demo, that tradeoff is completely fine to make and worth being able to explain if asked.

---

## Phase 6 — Caching (do this before you hit rate limits)

TMDb's free tier rate-limits requests. Once 3 of you are hitting it simultaneously during dev, you'll feel it fast. Add a simple in-memory cache to `tmdb.js`:

```javascript
const cache = new Map();
const TTL = 1000 * 60 * 60; // 1 hour

async function tmdbFetchCached(path, params) {
  const key = path + JSON.stringify(params);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < TTL) return hit.data;
  const data = await tmdbFetch(path, params);
  cache.set(key, { data, time: Date.now() });
  return data;
}
```

This alone will save your team a lot of friction during the build.

---

## Suggested 4-week timeline and role split

| Week | You (backend + recs) | Friend A | Friend B |
|---|---|---|---|
| 1 | TMDb key, backend skeleton, `/search` and `/films/:id` endpoints, signup/login endpoints (Phase 5.5) | Set up React + Vite + Tailwind, build static FilmCard + Library page against mock data | Build FilmDetail modal + navigation/tabs against mock data, build login/signup form UI |
| 2 | Build `/discover` endpoints for Explore tab, Postgres schema, auth middleware on user routes | Connect Library page to your real `/search` endpoint | Build My List page (watchlist/watched), connect to `/user_films` endpoints, wire login form to real auth endpoints |
| 3 | Build mood mapping + taste-graph scoring, `/recommend` endpoint | Build For You page UI (mood picker), connect to `/recommend` | Polish: loading states, empty states, error handling across all pages |
| 4 | Caching, deploy backend (Render/Railway), write up the recommendation logic for your portfolio README | Deploy frontend (Vercel), responsive/mobile pass | QA pass: test all flows end to end, fix bugs found |

Week 1 deliberately has your friends building against fake/mock data so nobody is blocked waiting on your API to exist — they wire up to the real thing in week 2 once your endpoints are live.

---

## What makes this a strong portfolio piece

When you write this up afterward, the things worth highlighting aren't "I used React and an API" — that's table stakes. What's actually distinctive:
- You designed a mood taxonomy that doesn't exist in any movie API — that's original product thinking
- The taste-graph is a real (if simple) personalization algorithm you built and can explain the logic of in an interview
- You made an explicit architecture decision (backend proxy vs direct API calls) and can articulate why
- The country/genre curation reflects actual editorial judgment, not just "whatever the API returns sorted by popularity"

That's a much stronger story than "built a movie app with an API."

---

## Quick reference links

- TMDb API docs: https://developer.themoviedb.org/docs/getting-started
- TMDb discover endpoint (your main workhorse): https://developer.themoviedb.org/reference/discover-movie
- Supabase docs: https://supabase.com/docs
- Vercel deployment: https://vercel.com/docs
