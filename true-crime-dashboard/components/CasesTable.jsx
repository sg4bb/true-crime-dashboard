"use client";

import { useMemo, useState } from "react";
import { Search, Filter, X, FileText, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import StatusPill from "./StatusPill";
import Stars from "./Stars";
import PdfModal from "./PdfModal";

const COLUMNS = [
  { key: "report_number", label: "Report #", mono: true },
  { key: "pd", label: "Agencia" },
  { key: "suspect", label: "Sospechoso" },
  { key: "incident_type", label: "Tipo" },
  { key: "status", label: "Estado" },
  { key: "incident_date", label: "Fecha" },
  { key: "charges", label: "Cargos" },
  { key: "rating", label: "Rating" },
  { key: "pdf", label: "Reporte" },
];

const TABS = [
  { key: "all", label: "Todos" },
  { key: "Ready to Review", label: "Ready to Review" },
  { key: "Graded", label: "Graded" },
  { key: "Skipped", label: "Skipped" },
  { key: "Closed", label: "Closed" },
];

export default function CasesTable({ initialCases }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("incident_date");
  const [sortDir, setSortDir] = useState("desc");
  const [activeCase, setActiveCase] = useState(null);

  const filtered = useMemo(() => {
    let rows = initialCases.filter((c) => (tab === "all" ? true : c.status === tab));

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (c) =>
          (c.report_number || "").toLowerCase().includes(q) ||
          (c.suspect || "").toLowerCase().includes(q) ||
          (c.charges || "").toLowerCase().includes(q)
      );
    }

    rows = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [initialCases, tab, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const tabCounts = useMemo(() => {
    const counts = { all: initialCases.length };
    for (const t of TABS.slice(1)) {
      counts[t.key] = initialCases.filter((c) => c.status === t.key).length;
    }
    return counts;
  }, [initialCases]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-100">Case records</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {filtered.length} de {initialCases.length} casos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-neutral-800 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-amber-500 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-neutral-600">{tabCounts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por caso, sospechoso o cargos..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-8 pr-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-neutral-800 rounded-md text-neutral-400 hover:bg-neutral-900">
          <Filter size={12} />
          Filtro
        </button>
        {query && (
          <button
            onClick={() => setQuery("")}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      <div className="border border-neutral-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-900/60 border-b border-neutral-800">
              {COLUMNS.map((col) => (
                <th key={col.key} className="text-left px-3 py-2 text-xs font-medium text-neutral-500 whitespace-nowrap">
                  {col.key === "pdf" ? (
                    col.label
                  ) : (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-neutral-300"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : (
                        <ArrowUpDown size={10} className="opacity-40" />
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                <td className="px-3 py-2 font-mono text-xs text-neutral-400 whitespace-nowrap">
                  {c.report_number}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs border border-neutral-700 text-neutral-400">
                    {c.pd}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-200 whitespace-nowrap">{c.suspect}</td>
                <td className="px-3 py-2 text-neutral-400 whitespace-nowrap">{c.incident_type}</td>
                <td className="px-3 py-2">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-3 py-2 text-neutral-500 text-xs whitespace-nowrap">
                  {c.incident_date}
                </td>
                <td className="px-3 py-2 text-neutral-400 text-xs max-w-[220px] truncate">
                  {c.charges}
                </td>
                <td className="px-3 py-2">
                  <Stars n={c.rating} />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setActiveCase(c)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  >
                    <FileText size={11} />
                    Ver PDF
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-neutral-600 text-sm">
                  Ningún caso coincide con esta búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activeCase && <PdfModal caseItem={activeCase} onClose={() => setActiveCase(null)} />}
    </div>
  );
}
