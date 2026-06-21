import React, { useState, useEffect, useCallback } from "react";
import * as api from "../api/client";
import { useAuth } from "../api/AuthContext";
import FilmCard from "../components/FilmCard";
import FilmDetail from "../components/FilmDetail";

// TMDb ISO 3166-1 country codes for the countries the build guide curates around.
const COUNTRIES = [
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "IN", label: "India" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "DE", label: "Germany" },
  { code: "IR", label: "Iran" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "AR", label: "Argentina" },
  { code: "CN", label: "China" },
  { code: "HK", label: "Hong Kong" },
  { code: "TW", label: "Taiwan" },
  { code: "PL", label: "Poland" },
  { code: "DK", label: "Denmark" },
];

export default function Explore() {
  const [country, setCountry] = useState("JP");
  const [genres, setGenres] = useState([]);
  const [genreId, setGenreId] = useState("");
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openFilm, setOpenFilm] = useState(null);
  const [myFilms, setMyFilms] = useState({});

  const { isLoggedIn } = useAuth();

  const refreshMyFilms = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const rows = await api.getMyFilms();
      const map = {};
      rows.forEach((r) => (map[r.tmdb_id] = { status: r.status, rating: r.rating }));
      setMyFilms(map);
    } catch {
      /* non-fatal */
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshMyFilms();
  }, [refreshMyFilms]);

  useEffect(() => {
    api.getGenres().then(setGenres).catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .discoverFilms({ country, genreId: genreId || undefined })
      .then((data) => setFilms(data.films))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [country, genreId]);

  async function handleSetStatus(tmdbId, status) {
    if (!isLoggedIn) return setError("Log in to save films to your list.");
    const prev = myFilms[tmdbId];
    setMyFilms((m) => ({ ...m, [tmdbId]: { ...prev, status } }));
    try {
      await api.saveFilmStatus({ tmdbId, status });
    } catch {
      setMyFilms((m) => ({ ...m, [tmdbId]: prev || {} }));
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
      <h1 className="font-serif text-2xl font-medium mb-1">Explore</h1>
      <p className="text-sm text-ink-soft mb-6">Browse by country. Curated for quality, not popularity.</p>

      <div className="flex gap-3 mb-8 flex-wrap">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-rule_soft rounded-lg px-3 py-2 text-sm bg-white focus:border-archive-600 outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={genreId}
          onChange={(e) => setGenreId(e.target.value)}
          className="border border-rule_soft rounded-lg px-3 py-2 text-sm bg-white focus:border-archive-600 outline-none"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {error && (
        <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2 mb-6 inline-block">{error}</p>
      )}
      {!loading && !error && films.length === 0 && (
        <p className="text-sm text-ink-faint">No films found for this combination — try a different genre.</p>
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
