import React from "react";
import StarRating from "./StarRating";
import Badge from "./Badge";

export default function FilmCard({ film, status, rating, onSetStatus, onSetRating, onOpen }) {
  return (
    <div
      onClick={() => onOpen(film)}
      className="bg-white border border-rule rounded-xl overflow-hidden cursor-pointer flex flex-col group hover:border-rule_soft transition-colors"
    >
      <div className="aspect-[2/3] bg-rule relative overflow-hidden">
        {film.poster ? (
          <img
            src={film.poster}
            alt={`${film.title} poster`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint text-sm px-3 text-center font-serif">
            {film.title}
          </div>
        )}
        {status === "watched" && (
          <div className="absolute top-2 right-2 bg-archive-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-sm">
            ✓
          </div>
        )}
        {status === "watchlist" && (
          <div className="absolute top-2 right-2 bg-info-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-sm">
            ⊕
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-serif text-[15px] font-medium leading-snug line-clamp-2">{film.title}</p>
          <p className="text-xs text-ink-soft mt-0.5">{film.year || "—"}</p>
        </div>

        {film.genres?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {film.genres.slice(0, 2).map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          {status === "watched" ? (
            <StarRating value={rating || 0} onChange={(v) => onSetRating(film.id, v)} size="sm" />
          ) : (
            <span className="text-xs text-ink-faint">{film.rating ? `${film.rating.toFixed(1)} / 10` : ""}</span>
          )}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onSetStatus(film.id, status === "watchlist" ? null : "watchlist")}
              aria-label="Toggle watchlist"
              aria-pressed={status === "watchlist"}
              className={`w-7 h-7 rounded-md border text-xs flex items-center justify-center transition-colors ${
                status === "watchlist"
                  ? "bg-info-50 border-info-600 text-info-600"
                  : "border-rule_soft text-ink-soft hover:border-ink-soft"
              }`}
            >
              ⊕
            </button>
            <button
              onClick={() => onSetStatus(film.id, status === "watched" ? null : "watched")}
              aria-label="Toggle watched"
              aria-pressed={status === "watched"}
              className={`w-7 h-7 rounded-md border text-xs flex items-center justify-center transition-colors ${
                status === "watched"
                  ? "bg-archive-50 border-archive-700 text-archive-700"
                  : "border-rule_soft text-ink-soft hover:border-ink-soft"
              }`}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
