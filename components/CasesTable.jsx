"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { MOCK_CASES } from "@/lib/mockCases";
import StatusPill from "./StatusPill";
import Stars from "./Stars";
import PdfModal from "./PdfModal";
import ChargesModal from "./ChargesModal";
import DateRangePicker from "./DateRangePicker";

const COLUMNS = [
  { key: "report_number", label: "Report #", mono: true, width: 215 },
  { key: "pd", label: "Agency", width: 170 },
  { key: "suspect", label: "Suspect", width: 180 },
  { key: "incident_type", label: "Type", width: 160 },
  { key: "status", label: "Status", width: 100 },
  { key: "incident_date", label: "Date", width: 100 },
  { key: "charges_number", label: "Charge #", width: 90 },
  { key: "charges", label: "Charges", width: 240 },
  { key: "rating", label: "Rating", width: 110 },
];

const TAB_KEYS = ["Open", "Closed"];
const TABS = [
  { key: "all", label: "All" },
  { key: "Open", label: "Open" },
  { key: "Closed", label: "Closed" },
];

function ChargeCount({ n }) {
  if (n === null || n === undefined || n === "") {
    return <span className="text-neutral-700 text-xs">—</span>;
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold">
      {n}
    </span>
  );
}

// --- Test mode: filters/sorts/paginates the MOCK_CASES array in memory ---
function runMockQuery({ tab, query, sortKey, sortDir, page, pageSize, dateFrom, dateTo }) {
  let rows = MOCK_CASES.filter((c) => (tab === "all" ? true : c.status === tab));

  if (query.trim()) {
    const q = query.toLowerCase();
    rows = rows.filter(
      (c) =>
        (c.report_number || "").toLowerCase().includes(q) ||
        (c.suspect || "").toLowerCase().includes(q) ||
        (c.charges || "").toLowerCase().includes(q) ||
        (c.incident_type || "").toLowerCase().includes(q)
    );
  }

  if (dateFrom) rows = rows.filter((c) => (c.incident_date || "") >= dateFrom);
  if (dateTo) rows = rows.filter((c) => (c.incident_date || "") <= dateTo);

  rows = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total };
}

function mockCounts() {
  const counts = { all: MOCK_CASES.length };
  for (const s of TAB_KEYS) counts[s] = MOCK_CASES.filter((c) => c.status === s).length;
  return counts;
}

export default function CasesTable() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortKey, setSortKey] = useState("incident_date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeCase, setActiveCase] = useState(null);
  const [activeChargesCase, setActiveChargesCase] = useState(null);
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    Open: 0,
    Closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const resetToFirstPage = () => setPage(1);

  // Search debounce: waits for the user to stop typing before querying.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      resetToFirstPage();
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Per-tab counts (independent of the current search/sort).
  useEffect(() => {
    let active = true;

    async function loadCounts() {
      if (!isSupabaseConfigured) {
        if (active) setTabCounts(mockCounts());
        return;
      }
      try {
        const { count: allCount } = await supabase
          .from("cases")
          .select("id", { count: "exact", head: true });

        const perStatus = await Promise.all(
          TAB_KEYS.map(async (s) => {
            const { count } = await supabase
              .from("cases")
              .select("id", { count: "exact", head: true })
              .eq("status", s);
            return [s, count || 0];
          })
        );

        if (active) {
          setTabCounts({ all: allCount || 0, ...Object.fromEntries(perStatus) });
        }
      } catch (e) {
        console.error("Error loading counts:", e);
      }
    }

    loadCounts();
    return () => {
      active = false;
    };
  }, []);

  // Main query: re-runs whenever tab, search, sort, page, page size, or date range changes.
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      if (!isSupabaseConfigured) {
        const { rows: mockRows, total } = runMockQuery({
          tab,
          query: debouncedQuery,
          sortKey,
          sortDir,
          page,
          pageSize,
          dateFrom,
          dateTo,
        });
        if (active) {
          setRows(mockRows);
          setTotalCount(total);
          setLoading(false);
        }
        return;
      }

      let q = supabase.from("cases").select("*", { count: "exact" });

      if (tab !== "all") q = q.eq("status", tab);

      if (debouncedQuery.trim()) {
        const term = `%${debouncedQuery.trim()}%`;
        q = q.or(
          `report_number.ilike.${term},suspect.ilike.${term},charges.ilike.${term},incident_type.ilike.${term},pd.ilike.${term}`
        );
      }

      if (dateFrom) q = q.gte("incident_date", dateFrom);
      if (dateTo) q = q.lte("incident_date", dateTo);

      q = q.order(sortKey, { ascending: sortDir === "asc", nullsFirst: false });

      const from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, error, count } = await q;

      if (!active) return;

      if (error) {
        console.error("Error querying Supabase:", error);
        setErrorMsg(error.message);
        setRows([]);
        setTotalCount(0);
      } else {
        setRows(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [tab, debouncedQuery, sortKey, sortDir, page, pageSize, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  // If the current page falls out of range (e.g. a search shrank the results), fix it.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    resetToFirstPage();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {!isSupabaseConfigured && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-md px-3 py-2">
          Showing test data — Supabase isn't configured yet. Fill in
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local
          to connect your real cases.
        </div>
      )}

      <div className="mb-6">
        <p className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">
          <span className="w-3.5 h-px bg-amber-500" />
          Reviewer Queue
        </p>
        <h1 className="text-2xl font-bold text-neutral-50 tracking-tight">Cases</h1>
        <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1.5">
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Loading...
            </>
          ) : (
            <>
              {totalCount.toLocaleString()} cases · Sort any column or open a report
              inline.
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-neutral-800 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              resetToFirstPage();
            }}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all duration-200 ${
              tab === t.key
                ? "border-amber-500 text-neutral-50"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 text-xs font-normal ${
                tab === t.key ? "text-amber-500/80" : "text-neutral-600"
              }`}
            >
              {tabCounts[t.key]?.toLocaleString() ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Report Number, Agency, Suspect..."
            className="w-full h-10 bg-neutral-900/80 border border-neutral-800 rounded-lg pl-9 pr-8 text-sm text-neutral-200 placeholder-neutral-500 shadow-sm shadow-black/20 transition-colors focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              title="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <DateRangePicker
            from={pendingDateFrom}
            to={pendingDateTo}
            onChange={({ from, to }) => {
              setPendingDateFrom(from);
              setPendingDateTo(to);
            }}
          />
          {(dateFrom || dateTo || pendingDateFrom || pendingDateTo) && (
            <button
              onClick={() => {
                setPendingDateFrom("");
                setPendingDateTo("");
                setDateFrom("");
                setDateTo("");
                resetToFirstPage();
              }}
              title="Clear date range"
              className="flex items-center p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setDateFrom(pendingDateFrom);
            setDateTo(pendingDateTo);
            resetToFirstPage();
          }}
          className="relative flex items-center gap-1.5 h-10 px-3.5 text-xs font-medium rounded-lg bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20 transition-all duration-150 hover:bg-amber-400 active:scale-[0.97]"
        >
          <Search size={13} strokeWidth={2.5} />
          Search
          {(pendingDateFrom !== dateFrom || pendingDateTo !== dateTo) && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-100 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-100 border border-amber-600" />
            </span>
          )}
        </button>
      </div>

      <div
        className={`border border-neutral-800 rounded-lg overflow-x-auto transition-opacity duration-150 ${
          loading ? "opacity-60" : "opacity-100"
        }`}
      >
        <table className="w-full text-sm table-fixed">
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-neutral-800/50 border-b border-neutral-800">
              {COLUMNS.map((col) => (
                <th key={col.key} className="text-left px-3 py-2 text-xs font-medium text-neutral-500 whitespace-nowrap">
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
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c, idx) => (
              <tr key={c.id} className="border-b border-neutral-900 border-l-2 border-l-transparent hover:border-l-amber-500 hover:bg-neutral-800/50 transition-colors duration-150 animate-row-in" style={{ animationDelay: `${Math.min(idx, 20) * 15}ms` }}>
                <td className="px-3 py-2 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={`/cases/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-amber-400 hover:underline transition-colors truncate"
                    >
                      {c.report_number}
                    </a>
                    <button
                      onClick={() => setActiveCase(c)}
                      title="View PDF report"
                      className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-semibold tracking-wide rounded-full bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-400 hover:shadow-md hover:shadow-amber-500/30 transition-all duration-150 active:scale-90"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="flex w-full px-1 py-1 rounded text-xs border border-neutral-700 text-neutral-400 truncate">
                    {c.pd || "ㅤ"}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-200 truncate">{c.suspect}</td>
                <td className="px-3 py-2 text-neutral-400 truncate">{c.incident_type}</td>
                <td className="px-3 py-2">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-3 py-2 text-neutral-500 text-xs whitespace-nowrap">
                  {c.incident_date}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setActiveChargesCase(c)}
                    className="hover:scale-110 transition-transform duration-150 active:scale-90"
                  >
                    <ChargeCount n={c.charges_number} />
                  </button>
                </td>
                <td className="px-3 py-2 text-neutral-400 text-xs truncate">
                  {c.charges}
                </td>
                <td className="px-3 py-2">
                  <Stars n={c.rating} />
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-neutral-600 text-sm">
                  {errorMsg ? `Error: ${errorMsg}` : "No cases match this search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-neutral-500">
          Showing {rangeStart}–{rangeEnd} of {totalCount.toLocaleString()} cases
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            Per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                resetToFirstPage();
              }}
              className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-2 py-1 text-xs border border-neutral-800 rounded-md text-neutral-400 hover:bg-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={12} /> Previous
            </button>
            <span className="text-xs text-neutral-500 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-2 py-1 text-xs border border-neutral-800 rounded-md text-neutral-400 hover:bg-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {activeCase && <PdfModal caseItem={activeCase} onClose={() => setActiveCase(null)} />}
      {activeChargesCase && (
        <ChargesModal caseItem={activeChargesCase} onClose={() => setActiveChargesCase(null)} />
      )}
    </div>
  );
}