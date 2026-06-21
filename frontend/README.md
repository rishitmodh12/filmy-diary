# Filmy Diary — frontend

React + Vite + Tailwind. Talks only to the Filmy Diary backend (`src/api/client.js`) — never to TMDb directly.

## Setup

```bash
npm install
cp .env.example .env
```

`.env` just needs `VITE_API_BASE` pointing at wherever the backend is running (`http://localhost:4000` by default — matches the backend's default port).

## Run it

```bash
npm run dev
```

Opens at `http://localhost:5173`. Make sure the backend (`filmy-diary-backend`) is running too, in a separate terminal — this frontend has nothing to show without it.

## What's here

| Page | Route | What it does |
|---|---|---|
| Library | `/` | Search TMDb for any film, save to watchlist, mark watched, rate |
| For you | `/for-you` | Mood picker + taste-graph recommendations (taste needs login) |
| Explore | `/explore` | Browse curated picks by country and genre |
| My list | `/my-list` | Your watchlist and watched history (needs login) |
| Login | `/login` | Username + password signup/login, no email |

## Design notes

The visual identity leans into "film society ledger" rather than a streaming-service look — warm paper background, a serif (Lora) for film titles, a deep archive-green as the signature color instead of generic streaming red. The star rating uses a custom "stamp" SVG rather than an icon library, since the whole app's framing is a diary you're stamping entries into, not a product you're rating.

If you want to adjust the palette or type, everything is centralized in `tailwind.config.js` under `theme.extend` — change a token there and it updates everywhere, rather than hunting through every component.

## State management

Deliberately simple: no Redux, no global state library. `AuthContext` (in `src/api/AuthContext.jsx`) is the only context — it just tracks whether someone's logged in. Each page fetches and owns its own film data locally with `useState`/`useEffect`. For an app this size, that's the right amount of complexity — reach for something heavier only if pages start needing to share live film data with each other, which they don't yet.

## What's not built yet

- Loading skeletons (currently just text like "Loading…" — fine for now, nice polish later)
- Pagination on search/discover results (TMDb returns pages; we only show page 1 right now)
- Toasts/confirmation on save actions (saves happen silently — works, but a small "Saved" toast would feel more responsive)
