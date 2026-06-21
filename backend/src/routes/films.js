const express = require("express");
const router = express.Router();
const tmdb = require("../services/tmdb");

function shapeFilm(raw) {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
    poster: raw.poster_path ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` : null,
    overview: raw.overview,
    rating: raw.vote_average,
    genres: raw.genres ? raw.genres.map((g) => g.name) : raw.genre_ids || [],
    runtime: raw.runtime,
    originCountry: raw.origin_country || [],
  };
}

function handleTmdbError(err, res) {
  if (err.code === "NO_TMDB_TOKEN") {
    return res.status(503).json({ error: err.message });
  }
  console.error("TMDb route error:", err.message);
  return res.status(502).json({ error: "Could not reach TMDb right now" });
}

router.get("/search", async (req, res) => {
  const { q, page } = req.query;
  if (!q) return res.status(400).json({ error: "Query param 'q' is required" });

  try {
    const data = await tmdb.searchMovies(q, page);
    res.json({
      page: data.page,
      totalResults: data.total_results,
      films: data.results.map(shapeFilm),
    });
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get("/discover", async (req, res) => {
  const { country, genreId, page } = req.query;
  try {
    const data = await tmdb.discoverByCountryAndGenre({ country, genreId, page });
    res.json({
      page: data.page,
      totalResults: data.total_results,
      films: data.results.map(shapeFilm),
    });
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get("/genres", async (req, res) => {
  try {
    const data = await tmdb.getGenres();
    res.json(data.genres);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await tmdb.getMovieDetails(req.params.id);
    res.json(shapeFilm(data));
  } catch (err) {
    handleTmdbError(err, res);
  }
});

module.exports = router;
