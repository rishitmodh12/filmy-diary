import React from "react";

// Renders a deterministic avatar from DiceBear's free, no-auth HTTP API.
// Same seed always produces the same image, so once a user picks one at
// signup, it stays consistent everywhere they appear in the app.
const DICEBEAR_STYLE = "adventurer"; // friendly, expressive — good "pick a face" feel

export function avatarUrl(seed, size = 64) {
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

export default function Avatar({ seed, size = 40, className = "" }) {
  if (!seed) {
    return (
      <div
        className={`rounded-full bg-rule flex items-center justify-center text-ink-faint text-xs ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }
  return (
    <img
      src={avatarUrl(seed, size * 2)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full bg-rule ${className}`}
    />
  );
}
