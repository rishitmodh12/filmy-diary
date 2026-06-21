import React, { useState, useEffect, useCallback } from "react";
import * as api from "../api/client";
import { useAuth } from "../api/AuthContext";
import FilmCard from "../components/FilmCard";
import FilmDetail from "../components/FilmDetail";

export default function Library() {
  const [query, setQuery] = useState("");
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openFilm, setOpenFilm] = useState(null);
  const [myFilms, setMyFilms] = useState({}); // tmdbId -> { status, rating }

  const { isLoggedIn } = useAuth();

  const refreshMyFilms = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const rows = await api.getMyFilms();
      const map = {};
      rows.forEach((r) => (map[r.tmdb_id] = { status: r.status, rating: r.rating }));
      setMyFilms(map);
    } catch {
      // not fatal — list just won't show status badges
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshMyFilms();
  }, [refreshMyFilms]);

  async function runSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchFilms(query);
      setFilms(data.films);
    } catch (err) {
      setError(err.message);
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetStatus(tmdbId, status) {
    if (!isLoggedIn) return setError("Log in to save films to your list.");
    const prev = myFilms[tmdbId];
    setMyFilms((m) => ({ ...m, [tmdbId]: { ...prev, status } }));
    try {
      await api.saveFilmStatus({ tmdbId, status });
    } catch {
      setMyFilms((m) => ({ ...m, [tmdbId]: prev || {} })); // revert on failure
    }
  }

  async function handleSetRating(tmdbId, rating) {
    if (!isLoggedIn) return setError("Log in to rate films.");
    const prev = myFilms[tmdbId];
    setMyFilms((m) => ({ ...m, [tmdbId]: { ...prev, rating, status: "watched" } }));
    try {
      await api.saveFilmStatus({ tmdbId, rating, status: "watched" });
    } catch {
      setMyFilms((m) => ({ ...m, [tmdbId]: prev || {} }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-2xl font-medium mb-1">Library</h1>
      <p className="text-sm text-ink-soft mb-6">Search for any film to track, rate, or save for later.</p>

      <form onSubmit={runSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          className="flex-1 border border-rule_soft rounded-lg px-3 py-2 text-sm bg-white focus:border-archive-600 outline-none"
        />
        <button
          type="submit"
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium hover:bg-archive-700 transition-colors"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2 mb-6 inline-block">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-ink-soft">Searching…</p>}

      {!loading && films.length === 0 && !error && (
        <p className="text-sm text-ink-faint">Search above to find films. Try a director's name or a title.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {films.map((f) => (
          <FilmCard
            key={f.id}
            film={f}
            status={myFilms[f.id]?.status}
            rating={myFilms[f.id]?.rating}
            onSetStatus={handleSetStatus}
            onSetRating={handleSetRating}
            onOpen={setOpenFilm}
          />
        ))}
      </div>

      <FilmDetail
        film={openFilm}
        status={openFilm ? myFilms[openFilm.id]?.status : null}
        rating={openFilm ? myFilms[openFilm.id]?.rating : null}
        onSetStatus={handleSetStatus}
        onSetRating={handleSetRating}
        onClose={() => setOpenFilm(null)}
      />
    </div>
  );
}
