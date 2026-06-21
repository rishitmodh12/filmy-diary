// Single source of truth for talking to the backend. Components never call
// fetch() directly — they call functions exported here. If the backend's
// base URL or auth scheme ever changes, this is the only file that changes.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("filmyDiaryToken");
}

function setToken(token) {
  if (token) localStorage.setItem("filmyDiaryToken", token);
}

function clearToken() {
  localStorage.removeItem("filmyDiaryToken");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data;
}

// --- Auth ---
export async function signup(username, password) {
  const data = await request("/auth/signup", { method: "POST", body: { username, password } });
  setToken(data.token);
  return data.user;
}

export async function login(username, password) {
  const data = await request("/auth/login", { method: "POST", body: { username, password } });
  setToken(data.token);
  return data.user;
}

export function logout() {
  clearToken();
}

export function isLoggedIn() {
  return Boolean(getToken());
}

// --- Films ---
export function searchFilms(query, page = 1) {
  return request(`/films/search?q=${encodeURIComponent(query)}&page=${page}`);
}

export function getFilmDetails(id) {
  return request(`/films/${id}`);
}

export function discoverFilms({ country, genreId, page = 1 } = {}) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (genreId) params.set("genreId", genreId);
  params.set("page", page);
  return request(`/films/discover?${params.toString()}`);
}

export function getGenres() {
  return request("/films/genres");
}

// --- Recommendations ---
export function getMoodRecommendations(mood) {
  return request(`/films/recommend/mood?mood=${encodeURIComponent(mood)}`);
}

export function getTasteRecommendations() {
  return request("/films/recommend/taste", { auth: true });
}

// --- User film list (watchlist / watched / ratings) ---
export function getMyFilms() {
  return request("/user_films", { auth: true });
}

export function saveFilmStatus({ tmdbId, status, rating }) {
  return request("/user_films", { method: "POST", body: { tmdbId, status, rating }, auth: true });
}

export function removeFilm(tmdbId) {
  return request(`/user_films/${tmdbId}`, { method: "DELETE", auth: true });
}
