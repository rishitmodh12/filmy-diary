// The recommendation engine. This is the part of Filmy Diary that's genuinely
// yours — TMDb has no concept of "mood," so this mapping is original design work.
//
// Two engines live here:
//   1. moodToDiscoverParams() — translates a mood into TMDb /discover filters
//   2. scoreForTaste()        — ranks candidate films against a user's rating history

// TMDb's official genre IDs (from /genre/movie/list — stable, safe to hardcode)
const GENRE_IDS = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  SciFi: 878,
  Thriller: 53,
  War: 10752,
};

// TMDb keyword IDs for finer-grained mood signal beyond genre alone.
// (Looked up once via /search/keyword and hardcoded — stable, no need to call
// that endpoint at runtime.)
const KEYWORD_IDS = {
  basedOnNovel: 818,
  oneTake: 1568,         // long-take / single-shot heavy films, good "slow" signal
  nonlinearTimeline: 4565,
  coming_of_age: 9714,
  slowBurn: 158718,
  antihero: 173272,
  familyRelationships: 9840,
};

// The mood taxonomy. Each mood maps to a small set of genres (the broad signal)
// plus optional keywords (the precise signal) and a vote-count floor (controls
// how obscure/well-known the results skew).
const MOOD_MAP = {
  Epic: {
    genres: [GENRE_IDS.Adventure, GENRE_IDS.History, GENRE_IDS.War],
    minVoteCount: 200,
    sortBy: "popularity.desc",
  },
  Intense: {
    genres: [GENRE_IDS.Thriller, GENRE_IDS.Action, GENRE_IDS.Crime],
    minVoteCount: 150,
    sortBy: "vote_average.desc",
  },
  Melancholic: {
    genres: [GENRE_IDS.Drama, GENRE_IDS.Romance],
    keywords: [KEYWORD_IDS.slowBurn],
    minVoteCount: 100,
    sortBy: "vote_average.desc",
  },
  Slow: {
    genres: [GENRE_IDS.Drama],
    keywords: [KEYWORD_IDS.oneTake, KEYWORD_IDS.slowBurn],
    minVoteCount: 80,
    sortBy: "vote_average.desc",
  },
  Whimsical: {
    genres: [GENRE_IDS.Fantasy, GENRE_IDS.Comedy, GENRE_IDS.Animation],
    minVoteCount: 100,
    sortBy: "popularity.desc",
  },
  Warm: {
    genres: [GENRE_IDS.Family, GENRE_IDS.Comedy, GENRE_IDS.Drama],
    keywords: [KEYWORD_IDS.familyRelationships],
    minVoteCount: 100,
    sortBy: "vote_average.desc",
  },
  Energetic: {
    genres: [GENRE_IDS.Action, GENRE_IDS.Comedy, GENRE_IDS.Adventure],
    minVoteCount: 150,
    sortBy: "popularity.desc",
  },
  Tense: {
    genres: [GENRE_IDS.Thriller, GENRE_IDS.Mystery],
    keywords: [KEYWORD_IDS.slowBurn],
    minVoteCount: 100,
    sortBy: "vote_average.desc",
  },
  Dark: {
    genres: [GENRE_IDS.Crime, GENRE_IDS.Thriller, GENRE_IDS.Drama],
    keywords: [KEYWORD_IDS.antihero],
    minVoteCount: 100,
    sortBy: "vote_average.desc",
  },
  Nostalgic: {
    genres: [GENRE_IDS.Drama, GENRE_IDS.Romance, GENRE_IDS.History],
    keywords: [KEYWORD_IDS.coming_of_age],
    minVoteCount: 100,
    sortBy: "vote_average.desc",
  },
};

/**
 * Translate a mood name into TMDb /discover/movie query params.
 * Throws if the mood isn't recognized, so callers fail loudly rather than
 * silently returning unfiltered results.
 */
function moodToDiscoverParams(mood) {
  const config = MOOD_MAP[mood];
  if (!config) {
    const err = new Error(`Unknown mood: ${mood}. Valid moods: ${Object.keys(MOOD_MAP).join(", ")}`);
    err.code = "UNKNOWN_MOOD";
    throw err;
  }

  return {
    with_genres: config.genres.join(","),
    with_keywords: config.keywords ? config.keywords.join(",") : undefined,
    "vote_count.gte": config.minVoteCount,
    sort_by: config.sortBy,
  };
}

/**
 * Build a "taste profile" from a user's rated films (rating >= 4).
 * Input: array of { genres: string[], country: string, rating: number }
 * Output: weighted counts per genre/country, used to score new candidates.
 */
function buildTasteProfile(ratedFilms) {
  const liked = ratedFilms.filter((f) => f.rating >= 4);
  const genreCounts = {};
  const countryCounts = {};

  liked.forEach((f) => {
    (f.genres || []).forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    if (f.country) {
      countryCounts[f.country] = (countryCounts[f.country] || 0) + 1;
    }
  });

  return { genreCounts, countryCounts, sampleSize: liked.length };
}

/**
 * Score a single candidate film against a taste profile.
 * Genre match is weighted higher than country match, since genre is a
 * stronger taste signal than geography alone.
 */
function scoreForTaste(candidate, tasteProfile) {
  let score = 0;
  (candidate.genres || []).forEach((g) => {
    score += (tasteProfile.genreCounts[g] || 0) * 2;
  });
  if (candidate.country) {
    score += (tasteProfile.countryCounts[candidate.country] || 0) * 1.5;
  }
  return score;
}

/**
 * Rank a list of candidates by taste score, excluding anything the user
 * has already interacted with (watched or watchlisted).
 */
function rankByTaste(candidates, tasteProfile, alreadySeenIds = new Set()) {
  return candidates
    .filter((c) => !alreadySeenIds.has(c.id))
    .map((c) => ({ film: c, score: scoreForTaste(c, tasteProfile) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((c) => c.film);
}

module.exports = {
  GENRE_IDS,
  KEYWORD_IDS,
  MOOD_MAP,
  moodToDiscoverParams,
  buildTasteProfile,
  scoreForTaste,
  rankByTaste,
};
