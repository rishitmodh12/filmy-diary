import React, { useState } from "react";

// The "stamp" rating: a row of small ink marks rather than generic stars.
// This is the one signature visual flourish of the app — it echoes the
// idea of stamping an entry in a diary rather than rating a product.
export default function StarRating({ value = 0, onChange, size = "md", readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  const dims = {
    sm: { box: 16, gap: 2 },
    md: { box: 20, gap: 3 },
    lg: { box: 26, gap: 4 },
  }[size];

  return (
    <div
      className="inline-flex items-center"
      style={{ gap: dims.gap }}
      role={readOnly ? undefined : "radiogroup"}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={value === n}
          onClick={(e) => {
            e.stopPropagation();
            if (onChange) onChange(n === value ? 0 : n);
          }}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`relative ${readOnly ? "cursor-default" : "cursor-pointer"} transition-transform ${
            !readOnly && "hover:-translate-y-0.5"
          }`}
          style={{ width: dims.box, height: dims.box }}
        >
          <svg viewBox="0 0 24 24" width={dims.box} height={dims.box}>
            <path
              d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2.1 9.8l7.1-.7L12 2.5z"
              fill={display >= n ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
              className={display >= n ? "text-stamp-500" : "text-rule_soft"}
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
