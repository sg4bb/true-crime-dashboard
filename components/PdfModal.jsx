"use client";

import { useEffect, useState } from "react";
import { X, FileText, ExternalLink, Loader2 } from "lucide-react";
import { supabase, PDF_BUCKET, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function PdfModal({ caseItem, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function resolveUrl() {
      setLoading(true);
      setError(null);

      if (caseItem.report_link) {
        if (active) {
          setUrl(caseItem.report_link);
          setLoading(false);
        }
        return;
      }

      if (!caseItem.pdf_path) {
        if (active) {
          setError("This case doesn't have a PDF attached yet.");
          setLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        if (active) {
          setError(
            "Test mode: connect Supabase (.env.local) to view real PDFs here."
          );
          setLoading(false);
        }
        return;
      }

      // Private bucket: request a signed URL valid for 10 minutes.
      const { data, error: signError } = await supabase.storage
        .from(PDF_BUCKET)
        .createSignedUrl(caseItem.pdf_path, 600);

      if (!active) return;

      if (signError) {
        setError("Couldn't load the PDF: " + signError.message);
      } else {
        setUrl(data.signedUrl);
      }
      setLoading(false);
    }

    resolveUrl();
    return () => {
      active = false;
    };
  }, [caseItem]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-3xl h-[85vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <div>
            <p className="text-sm font-medium text-neutral-100">
              {caseItem.report_number} — Incident Report
            </p>
            <p className="text-xs text-neutral-500">{caseItem.suspect}</p>
          </div>
          <div className="flex items-center gap-3">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
              >
                Open in new tab <ExternalLink size={11} />
              </a>
            )}
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-neutral-600">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Loading PDF...</p>
            </div>
          )}
          {!loading && error && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-neutral-600 px-8 text-center">
              <FileText size={32} />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && url && (
            <iframe src={url} title="Incident report PDF" className="w-full h-full bg-neutral-950" />
          )}
        </div>
      </div>
    </div>
  );
}