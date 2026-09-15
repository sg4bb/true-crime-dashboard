"use client";

import { useState } from "react";
import { Loader2, ChevronsUpDown } from "lucide-react";

const STATUS_STYLES = {
  Open: "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25",
  Closed: "bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700/80",
  Skipped: "bg-neutral-700/40 text-neutral-500 hover:bg-neutral-700/60",
};

export default function StatusToggle({ caseId, status: initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = status === "Open" ? "Closed" : "Open";
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch("/api/save-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, status: next }),
      });
      if (!res.ok) {
        // Revert on failure.
        setStatus(status);
      }
    } catch (e) {
      setStatus(status);
    } finally {
      setSaving(false);
    }
  }

  const style = STATUS_STYLES[status] || "bg-neutral-700 text-neutral-300";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      title="Click to toggle status"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-60 ${style}`}
    >
      {saving ? <Loader2 size={11} className="animate-spin" /> : <ChevronsUpDown size={11} />}
      {status}
    </button>
  );
}