"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

const VERDICT_STYLES = {
  "Strong candidate": "text-emerald-400",
  "Possible candidate": "text-amber-400",
  "Weak candidate": "text-neutral-500",
};

const RATING_STYLES = {
  1: "text-neutral-500 border-neutral-700",
  2: "text-neutral-500 border-neutral-700",
  3: "text-amber-400 border-amber-500/30",
  4: "text-emerald-400 border-emerald-500/30",
  5: "text-emerald-400 border-emerald-500/30",
};

function formatReview(text) {
  // The model replies with lines "Verdict: ...", "Rating: ...", "Reasoning: ...".
  const lines = text.split("\n").filter(Boolean);
  const get = (prefix) =>
    lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()))?.split(":").slice(1).join(":").trim();

  const rawRating = get("Rating");
  const ratingMatch = rawRating?.match(/(\d+)\s*\/\s*(\d+)/);

  return {
    verdict: get("Verdict") || null,
    rating: ratingMatch ? { value: Number(ratingMatch[1]), total: Number(ratingMatch[2]) } : null,
    reasoning: get("Reasoning") || text,
  };
}

function RatingChip({ rating }) {
  const style = RATING_STYLES[rating.value] || "text-neutral-400 border-neutral-700";
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 px-2 py-0.5 rounded-full border bg-neutral-950/60 font-mono text-xs font-semibold ${style}`}
    >
      {rating.value}
      <span className="text-neutral-600 font-normal">/{rating.total}</span>
    </span>
  );
}

export default function AIReviewCard({ caseItem }) {
  const [review, setReview] = useState(caseItem.ai_review || null);
  const [generatedAt, setGeneratedAt] = useState(caseItem.ai_review_generated_at || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseItem.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setReview(data.review);
        setGeneratedAt(data.generatedAt);
      }
    } catch (e) {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const parsed = review ? formatReview(review) : null;

  return (
    <div className="border border-neutral-700 rounded-xl overflow-hidden bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-700 bg-neutral-800/50">
        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">
          <Sparkles size={12} /> AI Review
        </p>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 active:bg-neutral-700 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:bg-transparent"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          {review ? "Re-analyse" : "Analyse"}
        </button>
      </div>

      <div className="p-4">
        {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

        {!review && !loading && !error && (
          <p className="text-sm text-neutral-600">No AI review stored for this case yet.</p>
        )}

        {loading && !review && (
          <p className="text-sm text-neutral-500 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Analysing case...
          </p>
        )}

        {parsed && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {parsed.verdict && (
                <span
                  className={`text-sm font-semibold ${
                    VERDICT_STYLES[parsed.verdict] || "text-neutral-300"
                  }`}
                >
                  {parsed.verdict}
                </span>
              )}
              {parsed.rating && <RatingChip rating={parsed.rating} />}
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{parsed.reasoning}</p>
            {generatedAt && (
              <p className="text-[11px] text-neutral-600 mt-1" suppressHydrationWarning>
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}