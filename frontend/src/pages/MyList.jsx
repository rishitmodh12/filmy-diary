import React, { useState, useEffect, useCallback } from "react";
import * as api from "../api/client";
import { useAuth } from "../api/AuthContext";
import FilmCard from "../components/FilmCard";
import FilmDetail from "../components/FilmDetail";

export default function MyList() {
  const { isLoggedIn } = useAuth();
  const [rows, setRows] = useState([]);
  const [filmDetails, setFilmDetails] = useState({}); // tmdbId -> shaped film
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFilm, setOpenFilm] = useState(null);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const myRows = await api.getMyFilms();
      setRows(myRows);

      // Fetch full details for each film so we can render proper cards
      // (the saved row only has tmdb_id, status, rating — not title/poster/etc).
      const details = {};
      await Promise.all(
        myRows.map(async (r) => {
          try {
            details[r.tmdb_id] = await api.getFilmDetails(r.tmdb_id);
          } catch {
            // skip films TMDb can't resolve rather than failing the whole list
          }
        })
      );
      setFilmDetails(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSetStatus(tmdbId, status) {
    try {
      await api.saveFilmStatus({ tmdbId, status });
      if (!status) {
        await api.removeFilm(tmdbId);
      }
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetRating(tmdbId, rating) {
    try {
      await api.saveFilmStatus({ tmdbId, rating, status: "watched" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="font-serif text-xl mb-2">Log in to see your list</p>
        <p className="text-sm text-ink-soft">Your watchlist, watched history, and ratings live here once you're signed in.</p>
      </div>
    );
  }

  const statusFor = (tmdbId) => rows.find((r) => r.tmdb_id === tmdbId)?.status;
  const ratingFor = (tmdbId) => rows.find((r) => r.tmdb_id === tmdbId)?.rating;

  const watchlist = rows.filter((r) => r.status === "watchlist").map((r) => filmDetails[r.tmdb_id]).filter(Boolean);
  const watched = rows
    .filter((r) => r.status === "watched")
    .map((r) => filmDetails[r.tmdb_id])
    .filter(Boolean)
    .sort((a, b) => (ratingFor(b.id) || 0) - (ratingFor(a.id) || 0));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-2xl font-medium mb-6">My list</h1>

      {error && (
        <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2 mb-6 inline-block">{error}</p>
      )}
      {loading && <p className="text-sm text-ink-soft">Loading your list…</p>}

      {!loading && (
        <>
          <section className="mb-12">
            <h2 className="text-sm font-medium mb-3">Watchlist ({watchlist.length})</h2>
            {watchlist.length === 0 ? (
              <p className="text-sm text-ink-faint">Nothing saved yet. Bookmark films from Library or Explore.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlist.map((f) => (
                  <FilmCard
                    key={f.id}
                    film={f}
                    status={statusFor(f.id)}
                    rating={ratingFor(f.id)}
                    onSetStatus={handleSetStatus}
                    onSetRating={handleSetRating}
                    onOpen={setOpenFilm}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium mb-3">Watched ({watched.length})</h2>
            {watched.length === 0 ? (
              <p className="text-sm text-ink-faint">Mark films as watched to build your history and ratings here.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watched.map((f) => (
                  <FilmCard
                    key={f.id}
                    film={f}
                    status={statusFor(f.id)}
                    rating={ratingFor(f.id)}
                    onSetStatus={handleSetStatus}
                    onSetRating={handleSetRating}
                    onOpen={setOpenFilm}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <FilmDetail
        film={openFilm}
        status={openFilm ? statusFor(openFilm.id) : null}
        rating={openFilm ? ratingFor(openFilm.id) : null}
        onSetStatus={handleSetStatus}
        onSetRating={handleSetRating}
        onClose={() => setOpenFilm(null)}
      />
    </div>
  );
}
