import React, { useEffect } from "react";
import StarRating from "./StarRating";
import Badge from "./Badge";

export default function FilmDetail({ film, status, rating, onSetStatus, onSetRating, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!film) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-rule shadow-xl"
      >
        <div className="flex">
          {film.poster && (
            <div className="hidden sm:block w-40 shrink-0">
              <img src={film.poster} alt={`${film.title} poster`} className="w-full h-full object-cover rounded-l-2xl" />
            </div>
          )}
          <div className="p-6 flex-1 min-w-0">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h2 className="font-serif text-2xl font-medium leading-tight">{film.title}</h2>
                <p className="text-sm text-ink-soft mt-1">
                  {film.year} {film.runtime ? `· ${film.runtime} min` : ""} {film.rating ? `· ${film.rating.toFixed(1)} / 10` : ""}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-md border border-rule_soft flex items-center justify-center text-ink-soft hover:text-ink hover:border-ink-soft shrink-0"
              >
                ✕
              </button>
            </div>

            {film.genres?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {film.genres.map((g) => (
                  <Badge key={g} tone="archive">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            {film.overview && (
              <p className="text-sm text-ink-soft leading-relaxed mt-4">{film.overview}</p>
            )}

            <div className="border-t border-rule mt-5 pt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => onSetStatus(film.id, status === "watchlist" ? null : "watchlist")}
                  className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                    status === "watchlist"
                      ? "bg-info-50 border-info-600 text-info-600"
                      : "border-rule_soft text-ink-soft hover:border-ink-soft"
                  }`}
                >
                  ⊕ Watchlist
                </button>
                <button
                  onClick={() => onSetStatus(film.id, status === "watched" ? null : "watched")}
                  className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                    status === "watched"
                      ? "bg-archive-50 border-archive-700 text-archive-700"
                      : "border-rule_soft text-ink-soft hover:border-ink-soft"
                  }`}
                >
                  ✓ Watched
                </button>
              </div>
              {status === "watched" && (
                <StarRating value={rating || 0} onChange={(v) => onSetRating(film.id, v)} size="lg" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
