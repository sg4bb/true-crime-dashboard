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
          setError("Este caso no tiene un PDF asociado todavía.");
          setLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        if (active) {
          setError("Modo de prueba: conecta Supabase para ver PDFs reales aquí.");
          setLoading(false);
        }
        return;
      }

      const { data, error: signError } = await supabase.storage
        .from(PDF_BUCKET)
        .createSignedUrl(caseItem.pdf_path, 600);

      if (!active) return;

      if (signError) {
        setError("No se pudo cargar el PDF: " + signError.message);
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

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-2 text-neutral-600 border border-neutral-800 rounded-lg">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Cargando PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-2 text-neutral-600 border border-neutral-800 rounded-lg px-8 text-center">
        <FileText size={32} />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex justify-end px-3 py-2 border-b border-neutral-800 bg-neutral-900/60">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
        >
          Abrir PDF en pestaña nueva <ExternalLink size={11} />
        </a>
      </div>
      <iframe src={url} title="Incident report PDF" className="w-full h-[70vh] bg-neutral-950" />
    </div>
  );
}