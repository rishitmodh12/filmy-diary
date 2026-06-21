const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

// Get the logged-in user's full film list (watched + watchlist)
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "select tmdb_id, status, rating, updated_at from user_films where user_id = $1",
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get user_films error:", err.message);
    res.status(500).json({ error: "Could not load your film list" });
  }
});

// Set or update a film's status (watched / watchlist) and/or rating.
// Upsert: if the user already has a row for this film, update it instead of erroring.
router.post("/", requireAuth, async (req, res) => {
  const { tmdbId, status, rating } = req.body;

  if (!tmdbId) return res.status(400).json({ error: "tmdbId is required" });
  if (status && !["watched", "watchlist"].includes(status)) {
    return res.status(400).json({ error: "status must be 'watched' or 'watchlist'" });
  }
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }

  try {
    const result = await db.query(
      `insert into user_films (user_id, tmdb_id, status, rating, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (user_id, tmdb_id)
       do update set
         status = coalesce($3, user_films.status),
         rating = coalesce($4, user_films.rating),
         updated_at = now()
       returning tmdb_id, status, rating, updated_at`,
      [req.user.userId, tmdbId, status || null, rating || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Upsert user_films error:", err.message);
    res.status(500).json({ error: "Could not save your update" });
  }
});

// Remove a film from the user's list entirely (un-bookmark / un-mark watched)
router.delete("/:tmdbId", requireAuth, async (req, res) => {
  try {
    await db.query("delete from user_films where user_id = $1 and tmdb_id = $2", [
      req.user.userId,
      req.params.tmdbId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user_films error:", err.message);
    res.status(500).json({ error: "Could not remove this film" });
  }
});

module.exports = router;
