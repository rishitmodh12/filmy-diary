import React from "react";

const TONES = {
  default: "bg-rule text-ink-soft",
  archive: "bg-archive-50 text-archive-700",
  coral: "bg-coral-50 text-coral-700",
  info: "bg-info-50 text-info-600",
};

export default function Badge({ children, tone = "default" }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}
