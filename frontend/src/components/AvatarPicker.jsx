import React, { useMemo } from "react";
import Avatar, { avatarUrl } from "./Avatar";

// Generates a fixed set of candidate seeds. Each seed deterministically maps
// to one avatar image via DiceBear, so this set looks identical every time
// the picker renders, rather than reshuffling on every keystroke.
const CANDIDATE_SEEDS = [
  "river-stone", "amber-fox", "quiet-comet", "paper-lantern",
  "violet-owl", "brass-key", "cinder-moth", "indigo-reel",
  "maple-spark", "salt-harbor", "ember-finch", "linen-dusk",
];

export default function AvatarPicker({ value, onChange }) {
  const seeds = useMemo(() => CANDIDATE_SEEDS, []);

  return (
    <div>
      <p className="text-sm text-ink-soft mb-2">Pick a face for your diary</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {seeds.map((seed) => {
          const selected = value === seed;
          return (
            <button
              key={seed}
              type="button"
              onClick={() => onChange(seed)}
              aria-label={`Choose this avatar`}
              aria-pressed={selected}
              className={`rounded-full p-0.5 border-2 transition-colors ${
                selected ? "border-archive-600" : "border-transparent hover:border-rule_soft"
              }`}
            >
              <img
                src={avatarUrl(seed, 96)}
                alt=""
                className="w-full aspect-square rounded-full bg-rule"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
