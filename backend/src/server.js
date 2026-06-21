require("dotenv").config();
const express = require("express");
const cors = require("cors");

const filmsRouter = require("./routes/films");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const recommendRouter = require("./routes/recommend");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Quick sanity check route — visit http://localhost:4000/health in a browser
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    tmdbConfigured: Boolean(
      process.env.TMDB_TOKEN &&
        process.env.TMDB_TOKEN !== "paste_your_v4_read_access_token_here"
    ),
    dbConfigured: Boolean(process.env.DATABASE_URL),
  });
});

app.use("/films", filmsRouter);
app.use("/films/recommend", recommendRouter);
app.use("/auth", authRouter);
app.use("/user_films", usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Filmy Diary backend running at http://localhost:${PORT}`);
  console.log(`Check http://localhost:${PORT}/health to see what's configured`);
});
