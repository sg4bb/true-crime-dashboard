"use client";

import { useState } from "react";
import { Sparkles, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

const VERDICT_STYLES = {
  "Strong candidate": "text-emerald-400",
  "Possible candidate": "text-amber-400",
  "Weak candidate": "text-neutral-500",
};

// Short action word shown in the recommendation box, derived from the verdict.
const RECOMMENDATION_LABEL = {
  "Strong candidate": "REQUEST",
  "Possible candidate": "MAYBE",
  "Weak candidate": "SKIP",
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
    summary: get("Summary") || null,
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

function FeedbackSection({ caseItem }) {
  const [feedback, setFeedback] = useState(caseItem.ai_review_feedback || null);
  const [note, setNote] = useState((caseItem.ai_review_feedback_note || "").trim());
  const [saving, setSaving] = useState(false);

  async function save(nextFeedback, nextNote) {
    setSaving(true);
    try {
      await fetch("/api/save-review-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseItem.id, feedback: nextFeedback, note: nextNote }),
      });
    } catch (e) {
      console.error("Couldn't save feedback:", e);
    } finally {
      setSaving(false);
    }
  }

  function handleThumb(value) {
    const next = feedback === value ? null : value;
    setFeedback(next);
    save(next, note);
  }

  function handleNoteBlur() {
    save(feedback, note);
  }

  return (
    <div className="border-t border-neutral-800 pt-3 mt-3">
      <p className="text-xs text-neutral-500 mb-2">
        Was the grade right?{" "}
        <span className="text-neutral-600">Feedback trains the grading model.</span>
      </p>
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => handleThumb("good")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150 active:scale-95 ${
            feedback === "good"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
          }`}
        >
          <ThumbsUp size={12} /> Good
        </button>
        <button
          type="button"
          onClick={() => handleThumb("bad")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150 active:scale-95 ${
            feedback === "bad"
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
          }`}
        >
          <ThumbsDown size={12} /> Bad
        </button>
        {saving && <Loader2 size={11} className="animate-spin text-neutral-500" />}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleNoteBlur}
        placeholder="Anything worth noting? (optional)"
        rows={2}
        className="w-full bg-neutral-950/60 border border-neutral-800 rounded-md px-2.5 py-2 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 resize-none"
      />
    </div>
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
          <div className="flex flex-col gap-3">
            {parsed.summary && (
              <p className="text-sm text-neutral-300 leading-relaxed">{parsed.summary}</p>
            )}

            <div className="border border-neutral-800 rounded-lg bg-neutral-950/40 p-3">
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                  Recommendation
                </span>
                {parsed.verdict && (
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${
                      VERDICT_STYLES[parsed.verdict] || "text-neutral-300"
                    }`}
                  >
                    {RECOMMENDATION_LABEL[parsed.verdict] || parsed.verdict}
                  </span>
                )}
                {parsed.rating && (
                  <span className="flex items-center gap-1.5 ml-auto text-[11px] text-neutral-500">
                    Case score <RatingChip rating={parsed.rating} />
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">{parsed.reasoning}</p>
            </div>

            {generatedAt && (
              <p className="text-[11px] text-neutral-600" suppressHydrationWarning>
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            )}

            <FeedbackSection caseItem={caseItem} />
          </div>
        )}
      </div>
    </div>
  );
}