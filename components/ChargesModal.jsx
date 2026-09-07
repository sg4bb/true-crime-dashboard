"use client";

import { X } from "lucide-react";

function chargesList(charges) {
  if (!charges) return [];
  return charges
    .split(/\n|;/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export default function ChargesModal({ caseItem, onClose }) {
  const charges = chargesList(caseItem.charges);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <p className="text-sm font-medium text-neutral-100 font-mono">
            {caseItem.report_number} — charges
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Close
            <X size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {charges.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {charges.map((charge, i) => (
                <li key={i} className="text-sm text-neutral-200">
                  {charge}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">No charges on record.</p>
          )}
        </div>
      </div>
    </div>
  );
}