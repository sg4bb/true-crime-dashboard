import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { MOCK_CASES } from "@/lib/mockCases";
import StatusPill from "@/components/StatusPill";
import Stars from "@/components/Stars";
import CasePdfViewer from "@/components/CasePdfViewer";

export const dynamic = "force-dynamic";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm text-neutral-200 whitespace-pre-line">{value || "—"}</p>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded text-xs border border-neutral-700 text-neutral-400">
      {children}
    </span>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/60">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{title}</p>
        {right}
      </div>
      <div className="p-4">{children}</div>
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
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 mb-4 w-fit"
      >
        <ArrowLeft size={12} /> Back to cases
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            <span className="font-mono">{caseItem.report_number}</span>
            {caseItem.suspect && (
              <span className="text-neutral-500 font-normal"> · {caseItem.suspect}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={caseItem.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {caseItem.pd && <Badge>{caseItem.pd}</Badge>}
        {caseItem.incident_type && <Badge>{caseItem.incident_type}</Badge>}
        <div className="flex items-center gap-1">
          <span className="text-xs text-neutral-600">Rating</span>
          <Stars n={caseItem.rating} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: details, charges, notes */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card title="Case Details">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Report #" value={caseItem.report_number} />
              <Field label="Charge #" value={caseItem.charges_number} />
              <Field label="Agency" value={caseItem.pd} />
              <Field label="Incident Type" value={caseItem.incident_type} />
              <Field label="Incident Date" value={caseItem.incident_date} />
              <Field label="Location" value={caseItem.incident_location} />
              <Field label="Suspect" value={caseItem.suspect} />
              <Field label="Suspect DOB" value={caseItem.suspect_dob} />
              <Field label="Officers" value={caseItem.police_officers} />
            </div>
          </Card>

          <Card title={`Charges${charges.length ? ` · ${charges.length}` : ""}`}>
            {charges.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {charges.map((charge, i) => (
                  <li key={i} className="text-sm text-neutral-200 border-b border-neutral-900 last:border-0 pb-2 last:pb-0">
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
              <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">
                {caseItem.summary}
              </p>
            </Card>
          )}

          <Card title="Notes">
            <p className="text-sm text-neutral-300 whitespace-pre-line">
              {caseItem.notes || <span className="text-neutral-600">No notes.</span>}
            </p>
          </Card>
        </div>

        {/* Right column: incident report */}
        <div className="lg:col-span-3">
          <div className="sticky top-6">
            <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
              <FileText size={12} /> Incident Report
            </p>
            <CasePdfViewer caseItem={caseItem} />
          </div>
        </div>
      </div>
    </div>
  );
}