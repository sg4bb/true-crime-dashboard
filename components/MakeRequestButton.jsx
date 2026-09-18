"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, Loader2, Copy, Check, X, AlertTriangle } from "lucide-react";

export default function MakeRequestButton({ caseItem }) {
  const [loading, setLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [letter, setLetter] = useState(null);
  const [copied, setCopied] = useState(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(toastTimeoutRef.current);
  }, []);

  function triggerErrorToast() {
    clearTimeout(toastTimeoutRef.current);
    setShowErrorToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowErrorToast(false), 4000);
  }

  async function handleClick() {
    setLoading(true);
    setShowErrorToast(false);
    try {
      const res = await fetch("/api/generate-request-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseItem.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        triggerErrorToast();
      } else {
        setLetter(data.letter);
      }
    } catch (e) {
      triggerErrorToast();
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Couldn't copy:", e);
    }
  }

  return (
    <>
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

      {letter && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in"
          onClick={() => setLetter(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 shrink-0">
              <p className="text-sm font-medium text-neutral-100">Public Records Request</p>
              <button
                onClick={() => setLetter(null)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={20}
                className="w-full h-full min-h-[400px] bg-neutral-950/60 border border-neutral-800 rounded-md px-3 py-2.5 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-800 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-500 transition-all duration-150 active:scale-95"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorToast && (
        <div className="fixed bottom-5 right-5 z-[60] w-full max-w-sm animate-fade-in-up">
          <div className="relative overflow-hidden rounded-xl bg-amber-600 shadow-lg shadow-black/30">
            <button
              onClick={() => setShowErrorToast(false)}
              className="absolute top-2.5 right-2.5 text-white/70 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
            <div className="flex items-start gap-3 px-4 py-3.5 pr-8">
              <AlertTriangle size={18} className="text-white shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Oops!</p>
                <p className="text-xs text-white/90 mt-0.5">
                  The server returned an error; please try again.
                </p>
              </div>
            </div>
            <div className="h-1 bg-white/25 w-full">
              <div className="h-full bg-white/70 animate-toast-shrink" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}