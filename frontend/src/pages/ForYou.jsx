import React, { useState, useEffect, useCallback } from "react";
import * as api from "../api/client";
import { useAuth } from "../api/AuthContext";
import FilmCard from "../components/FilmCard";
import FilmDetail from "../components/FilmDetail";

const MOODS = [
  { name: "Epic", desc: "Big, sweeping, larger than life" },
  { name: "Intense", desc: "Gripping, high-stakes, doesn't let go" },
  { name: "Melancholic", desc: "Quiet sadness, lingers after" },
  { name: "Slow", desc: "Patient, contemplative pacing" },
  { name: "Whimsical", desc: "Playful, light, a little magic" },
  { name: "Warm", desc: "Tender, comforting, humane" },
  { name: "Energetic", desc: "Fast-moving, propulsive" },
  { name: "Tense", desc: "Coiled, anxious, on edge" },
  { name: "Dark", desc: "Bleak, morally murky" },
  { name: "Nostalgic", desc: "Wistful for a remembered past" },
];

export default function ForYou() {
  const { isLoggedIn } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodFilms, setMoodFilms] = useState([]);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState(null);

  const [tasteFilms, setTasteFilms] = useState([]);
  const [tasteMessage, setTasteMessage] = useState(null);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [tasteError, setTasteError] = useState(null);

  const [openFilm, setOpenFilm] = useState(null);
  const [myFilms, setMyFilms] = useState({});

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
    if (!selectedMood) return;
    setMoodLoading(true);
    setMoodError(null);
    api
      .getMoodRecommendations(selectedMood)
      .then((data) => setMoodFilms(data.films))
      .catch((err) => setMoodError(err.message))
      .finally(() => setMoodLoading(false));
  }, [selectedMood]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setTasteLoading(true);
    setTasteError(null);
    api
      .getTasteRecommendations()
      .then((data) => {
        setTasteFilms(data.films || []);
        setTasteMessage(data.message || null);
      })
      .catch((err) => setTasteError(err.message))
      .finally(() => setTasteLoading(false));
  }, [isLoggedIn]);

  async function handleSetStatus(tmdbId, status) {
    if (!isLoggedIn) return;
    const prev = myFilms[tmdbId];
    setMyFilms((m) => ({ ...m, [tmdbId]: { ...prev, status } }));
    try {
      await api.saveFilmStatus({ tmdbId, status });
    } catch {
      setMyFilms((m) => ({ ...m, [tmdbId]: prev || {} }));
    }
  }

  async function handleSetRating(tmdbId, rating) {
    if (!isLoggedIn) return;
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
      <h1 className="font-serif text-2xl font-medium mb-1">For you</h1>
      <p className="text-sm text-ink-soft mb-8">Two ways to find your next watch.</p>

      <section className="mb-12">
        <h2 className="text-sm font-medium mb-1">What's the mood</h2>
        <p className="text-xs text-ink-soft mb-3">Pick a feeling, see what fits it.</p>
        <div className="flex gap-2 flex-wrap mb-5">
          {MOODS.map((m) => (
            <button
              key={m.name}
              title={m.desc}
              onClick={() => setSelectedMood(selectedMood === m.name ? null : m.name)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                selectedMood === m.name
                  ? "bg-info-50 border-info-600 text-info-600"
                  : "border-rule_soft text-ink-soft hover:border-ink-soft"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {moodLoading && <p className="text-sm text-ink-soft">Finding films…</p>}
        {moodError && (
          <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2 inline-block">{moodError}</p>
        )}
        {selectedMood && !moodLoading && !moodError && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {moodFilms.map((f) => (
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
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium mb-1">Because you rated films highly</h2>
        <p className="text-xs text-ink-soft mb-4">
          Built from the genres and countries of films you gave 4 stars or more.
        </p>

        {!isLoggedIn && (
          <p className="text-sm text-ink-faint">Log in and rate a few films to unlock this.</p>
        )}
        {isLoggedIn && tasteLoading && <p className="text-sm text-ink-soft">Building your taste profile…</p>}
        {isLoggedIn && tasteError && (
          <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2 inline-block">{tasteError}</p>
        )}
        {isLoggedIn && !tasteLoading && tasteMessage && (
          <p className="text-sm text-ink-faint">{tasteMessage}</p>
        )}
        {isLoggedIn && !tasteLoading && tasteFilms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tasteFilms.map((f) => (
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
        )}
      </section>

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
