"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";

export default function RatingInput({ caseId, rating: initialRating }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  const isPreview = hover > 0;
  const displayValue = hover || rating;

  async function handleClick(value) {
    // Clicking the currently-set star again clears the rating back to 0.
    const nextValue = value === rating ? 0 : value;
    setRating(nextValue);
    setSaving(true);
    try {
      await fetch("/api/save-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, rating: nextValue }),
      });
    } catch (e) {
      console.error("Couldn't save rating:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            onMouseEnter={() => setHover(i)}
            title={`Rate ${i} star${i > 1 ? "s" : ""}`}
            className="p-0.5 transition-transform duration-100 hover:scale-125 active:scale-95"
          >
            <Star
              size={14}
              className={
                i <= displayValue
                  ? isPreview
                    ? "fill-amber-400/40 text-amber-400/40"
                    : "fill-amber-400 text-amber-400"
                  : "text-neutral-700"
              }
            />
          </button>
        ))}
      </div>
      {saving && <Loader2 size={11} className="animate-spin text-neutral-500" />}
      {!rating && <span className="text-xs text-neutral-500">Ungraded</span>}
    </div>
  );
}