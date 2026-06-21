const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

router.post("/signup", async (req, res) => {
  const { username, password, avatarSeed } = req.body;

  if (!username || !password || password.length < 6) {
    return res.status(400).json({
      error: "Username and a password of at least 6 characters are required",
    });
  }

  try {
    const existing = await db.query("select id from users where username = $1", [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "That username is already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Fall back to username as the seed if the user skipped picking an avatar,
    // so everyone still gets a consistent, deterministic avatar.
    const seed = avatarSeed || username;

    const result = await db.query(
      "insert into users (username, password_hash, avatar_seed) values ($1, $2, $3) returning id, username, avatar_seed",
      [username, passwordHash, seed]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, avatarSeed: user.avatar_seed } });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Something went wrong creating your account" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const result = await db.query(
      "select id, username, password_hash, avatar_seed from users where username = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Incorrect username or password" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Incorrect username or password" });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, avatarSeed: user.avatar_seed } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Something went wrong logging you in" });
  }
});

// GET /auth/me — rehydrate the logged-in user from their token.
// Used on page load/refresh, since the frontend only persists the JWT,
// not the full user object.
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "select id, username, avatar_seed from users where id = $1",
      [req.user.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, username: user.username, avatarSeed: user.avatar_seed });
  } catch (err) {
    console.error("Get /auth/me error:", err.message);
    res.status(500).json({ error: "Could not load your account" });
  }
});

module.exports = router;
