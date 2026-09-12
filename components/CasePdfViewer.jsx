"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { supabase, PDF_BUCKET, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function CasePdfViewer({ caseItem }) {
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
          setError("Test mode: connect Supabase to view real PDFs here.");
          setLoading(false);
        }
        return;
      }

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
    <div className="border border-neutral-700 rounded-xl overflow-hidden bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-700 bg-neutral-800/50">
        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">
          <FileText size={12} /> Incident Report
        </p>
        {url && !loading && !error && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
          >
            Open PDF in new tab <ExternalLink size={11} />
          </a>
        )}
      </div>

      {loading && (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-2 text-neutral-600">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading PDF...</p>
        </div>
      )}

      {!loading && error && (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-2 text-neutral-600 px-8 text-center">
          <FileText size={32} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && url && (
        <iframe src={url} title="Incident report PDF" className="w-full h-[70vh] bg-neutral-950" />
      )}
    </div>
  );
}