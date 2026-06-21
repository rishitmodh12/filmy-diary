// All TMDb API calls live in this one file. If TMDb's API ever changes,
// or you swap in a different data source later, this is the only file that changes.

const TMDB_BASE = "https://api.themoviedb.org/3";

const cache = new Map();
const TTL = 1000 * 60 * 60; // 1 hour — saves you from hitting TMDb's rate limit during dev

function getToken() {
  const token = process.env.TMDB_TOKEN;
  if (!token || token === "paste_your_v4_read_access_token_here") {
    return null;
  }
  return token;
}

async function tmdbFetch(path, params = {}) {
  const token = getToken();
  if (!token) {
    const err = new Error(
      "TMDB_TOKEN is not set in .env yet. Once you have your key from themoviedb.org, paste it in and restart the server."
    );
    err.code = "NO_TMDB_TOKEN";
    throw err;
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const cacheKey = url.toString();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.time < TTL) {
    return hit.data;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`TMDb error ${res.status}: ${body}`);
    err.code = "TMDB_API_ERROR";
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  cache.set(cacheKey, { data, time: Date.now() });
  return data;
}

async function searchMovies(query, page = 1) {
  return tmdbFetch("/search/movie", { query, page, include_adult: false });
}

async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: "credits,keywords" });
}

async function discoverByCountryAndGenre({ country, genreId, page = 1 } = {}) {
  return tmdbFetch("/discover/movie", {
    with_origin_country: country,
    with_genres: genreId,
    sort_by: "vote_average.desc",
    "vote_count.gte": 100, // filters out obscure/low-data titles
    page,
  });
}

// More generic than discoverByCountryAndGenre — accepts any raw TMDb
// /discover/movie params. Used by the mood-recommendation engine, which
// needs finer control (keywords, custom sort, custom vote-count floor)
// than the country/genre helper above provides.
async function discoverWithParams(params = {}) {
  return tmdbFetch("/discover/movie", params);
}

async function getGenres() {
  return tmdbFetch("/genre/movie/list");
}

module.exports = {
  searchMovies,
  getMovieDetails,
  discoverByCountryAndGenre,
  discoverWithParams,
  getGenres,
};
