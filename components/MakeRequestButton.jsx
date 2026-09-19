"use client";

import { useState, useRef } from "react";
import { Mail, Loader2, Copy, Check, X, Pencil, Eye, RefreshCw } from "lucide-react";
import ErrorToast from "./ErrorToast";

export default function MakeRequestButton({ caseItem }) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(caseItem.request_subject || null);
  const [letter, setLetter] = useState(caseItem.request_letter || null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const toastRef = useRef(null);

  async function handleClick() {
    // Already generated for this case: just show it, no new AI call.
    if (subject && letter) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-request-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseItem.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastRef.current?.trigger();
      } else {
        setSubject(data.subject);
        setLetter(data.letter);
        setShowModal(true);
      }
    } catch (e) {
      toastRef.current?.trigger();
    } finally {
      setLoading(false);
    }
  }

  async function handleRerun() {
    setRerunning(true);
    try {
      const res = await fetch("/api/generate-request-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseItem.id, force: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastRef.current?.trigger();
      } else {
        setSubject(data.subject);
        setLetter(data.letter);
        setEditing(false);
      }
    } catch (e) {
      toastRef.current?.trigger();
    } finally {
      setRerunning(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${letter}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Couldn't copy:", e);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-3 px-3 py-1.5 text-xs rounded-full bg-zinc-800 text-amber-400 hover:bg-neutral-800/70 transition-all duration-150 active:scale-95 active:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin text-neutral-400" />
          ) : (
            <Mail size={13} className="text-amber-400" />
          )}
          Make Request
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in"
          onClick={() => {
            setShowModal(false);
            setEditing(false);
          }}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-700 shrink-0">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 shrink-0">
                  <Mail size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-100">Public Records Request</p>
                  <p className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                    <span>
                      {[caseItem.report_number, caseItem.suspect, caseItem.pd]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditing(false);
                }}
                className="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-1.5">Subject</p>
                <input
                  value={subject || ""}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-neutral-400">Letter</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy letter"}
                    </button>
                    <button
                      onClick={() => setEditing((v) => !v)}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      {editing ? <Eye size={12} /> : <Pencil size={12} />}
                      {editing ? "Preview" : "Edit text"}
                    </button>
                  </div>
                </div>
                {editing ? (
                  <textarea
                    value={letter || ""}
                    onChange={(e) => setLetter(e.target.value)}
                    rows={18}
                    autoFocus
                    className="w-full min-h-[380px] bg-neutral-950/60 border border-amber-500/40 rounded-md px-3 py-2.5 text-xs text-neutral-200 leading-relaxed focus:outline-none resize-none"
                  />
                ) : (
                  <div className="min-h-[380px] bg-neutral-950/60 border border-neutral-800 rounded-md px-3 py-2.5 text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                    {letter}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-800 shrink-0 min-h-[52px]">
              <button
                onClick={handleRerun}
                disabled={rerunning}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} className={rerunning ? "animate-spin" : ""} />
                {rerunning ? "Re-running…" : "Re-Run"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorToast ref={toastRef} />
    </>
  );
}