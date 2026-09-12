import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { MOCK_CASES } from "@/lib/mockCases";
import StatusPill from "@/components/StatusPill";
import Stars from "@/components/Stars";
import CasePdfViewer from "@/components/CasePdfViewer";
import AIReviewCard from "@/components/AIReviewCard";
import NotesEditor from "@/components/NotesEditor";

export const dynamic = "force-dynamic";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
      <p className="text-xs text-neutral-200 whitespace-pre-line">{value || "—"}</p>
    </div>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="border border-neutral-700 rounded-xl overflow-hidden bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-700 bg-neutral-800/50">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{title}</p>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Stat({ label, children }) {
  return (
    <div className="flex-1 px-4 py-2.5">
      <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="text-sm text-neutral-200">{children}</div>
    </div>
  );
}

function chargesList(charges) {
  if (!charges) return [];
  return charges
    .split(/\n|;/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export default async function CaseDetailPage({ params }) {
  const { id } = params;

  let caseItem = null;
  let notFound = false;

  if (!isSupabaseConfigured) {
    caseItem = MOCK_CASES.find((c) => c.id === id) || null;
  } else {
    const { data, error } = await supabase.from("cases").select("*").eq("id", id).single();
    if (error || !data) {
      notFound = true;
    } else {
      caseItem = data;
    }
  }

  if (!caseItem) {
    notFound = true;
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <h1 className="text-lg font-semibold text-neutral-100 mb-2">Case not found</h1>
        <p className="text-sm text-neutral-500 mb-4">
          There's no case with that identifier.
        </p>
        <Link href="/" className="text-sm text-amber-400 hover:underline">
          Back to table
        </Link>
      </div>
    );
  }

  const charges = chargesList(caseItem.charges);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link
        href="/"
        className="group flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-100 transition-colors mb-4 w-fit"
      >
        <ArrowLeft size={12} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
        Back to cases
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-50 tracking-tight">
            <span className="font-mono text-amber-400">{caseItem.report_number}</span>
            {caseItem.suspect && (
              <span className="text-neutral-50 font-normal"><span className="text-neutral-500 font-normal"> · </span>{caseItem.suspect}</span>
            )}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {[caseItem.pd, caseItem.incident_type].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-stretch divide-x divide-neutral-700 border border-neutral-700 rounded-xl bg-neutral-900 mb-6 mt-4">
        <Stat label="Status">
          <StatusPill status={caseItem.status} />
        </Stat>
        <Stat label="Rating">
          <div className="flex items-center gap-2">
            <Stars n={caseItem.rating} />
            {!caseItem.rating && <span className="text-xs text-neutral-500">Ungraded</span>}
          </div>
        </Stat>
        <Stat label="Charge #">{caseItem.charges_number || "—"}</Stat>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">
        {/* Left column: details, charges, notes */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card title="Case Details">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Report #" value={caseItem.report_number} />
              <Field label="Agency" value={caseItem.pd} />
              <Field label="Incident Type" value={caseItem.incident_type} />
              <Field label="Incident Date" value={caseItem.incident_date} />
              <Field label="Suspect" value={caseItem.suspect} />
              <Field label="Suspect DOB" value={caseItem.suspect_dob} />
              <div className="col-span-2">
                <Field label="Location" value={caseItem.incident_location} />
              </div>
              <div className="col-span-2">
                <Field label="Officers" value={caseItem.police_officers} />
              </div>
            </div>
          </Card>

          <Card title={`Charges${charges.length ? ` · ${charges.length}` : ""}`}>
            {charges.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {charges.map((charge, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-2.5 text-xs text-neutral-200 border-b border-neutral-800 last:border-0 pb-2.5 last:pb-0"
                  >
                    <span className="text-xs font-semibold text-neutral-600 shrink-0">
                      {i + 1}
                    </span>
                    {charge}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-600">No charges on record.</p>
            )}
          </Card>

          {caseItem.summary && (
            <Card title="Summary">
              <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                {caseItem.summary}
              </p>
            </Card>
          )}

          <NotesEditor caseItem={caseItem} />
        </div>

        {/* Right column: incident report */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 flex flex-col gap-4">
            <CasePdfViewer caseItem={caseItem} />
            <AIReviewCard caseItem={caseItem} />
          </div>
        </div>
      </div>
    </div>
  );
}