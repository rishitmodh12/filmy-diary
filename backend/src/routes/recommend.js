const express = require("express");
const router = express.Router();
const tmdb = require("../services/tmdb");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  GENRE_IDS,
  moodToDiscoverParams,
  buildTasteProfile,
  rankByTaste,
} = require("../services/recommend");

function shapeFilm(raw) {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
    poster: raw.poster_path ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` : null,
    overview: raw.overview,
    rating: raw.vote_average,
    genres: raw.genre_ids || (raw.genres ? raw.genres.map((g) => g.name) : []),
    originCountry: raw.origin_country || [],
  };
}

function handleTmdbError(err, res) {
  if (err.code === "NO_TMDB_TOKEN") {
    return res.status(503).json({ error: err.message });
  }
  console.error("Recommend route TMDb error:", err.message);
  return res.status(502).json({ error: "Could not reach TMDb right now" });
}

// GET /films/recommend/mood?mood=Melancholic
// No auth required — mood recommendations don't depend on a user's history.
router.get("/mood", async (req, res) => {
  const { mood } = req.query;
  if (!mood) return res.status(400).json({ error: "Query param 'mood' is required" });

  try {
    const params = moodToDiscoverParams(mood);
    const data = await tmdb.discoverWithParams(params);
    res.json({
      mood,
      films: data.results.map(shapeFilm),
    });
  } catch (err) {
    if (err.code === "UNKNOWN_MOOD") {
      return res.status(400).json({ error: err.message });
    }
    handleTmdbError(err, res);
  }
});

// GET /films/recommend/taste
// Requires auth — builds a taste profile from the logged-in user's 4-5 star
// ratings, then scores fresh TMDb candidates against it.
router.get("/taste", requireAuth, async (req, res) => {
  try {
    const ratedResult = await db.query(
      `select tmdb_id, rating from user_films
       where user_id = $1 and rating is not null`,
      [req.user.userId]
    );

    if (ratedResult.rows.length === 0) {
      return res.json({
        films: [],
        message: "Rate a few films 4 stars or higher to unlock taste-based recommendations.",
      });
    }

    // Fetch full details (genres, country) for each rated film, since the
    // user_films table only stores tmdb_id + rating, not genre/country.
    const ratedFilms = await Promise.all(
      ratedResult.rows.map(async (row) => {
        const details = await tmdb.getMovieDetails(row.tmdb_id);
        return {
          rating: row.rating,
          genres: details.genres ? details.genres.map((g) => g.name) : [],
          country: details.origin_country ? details.origin_country[0] : null,
        };
      })
    );

    const tasteProfile = buildTasteProfile(ratedFilms);

    // Pull a pool of candidates from the user's top genres to score against.
    const topGenreName = Object.entries(tasteProfile.genreCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const allUserFilmIds = new Set(
      (await db.query("select tmdb_id from user_films where user_id = $1", [req.user.userId]))
        .rows.map((r) => r.tmdb_id)
    );

    const genreId = GENRE_IDS[topGenreName];

    const discoverData = await tmdb.discoverByCountryAndGenre({ genreId });
    const candidates = discoverData.results.map(shapeFilm);

    const ranked = rankByTaste(candidates, tasteProfile, allUserFilmIds);

    res.json({
      basedOnRatings: ratedResult.rows.length,
      topGenre: topGenreName,
      films: ranked.slice(0, 12),
    });
  } catch (err) {
    handleTmdbError(err, res);
  }
});

module.exports = router;
