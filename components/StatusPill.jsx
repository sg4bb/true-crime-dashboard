const STATUS_STYLES = {
  Open: "bg-sky-500/15 text-sky-400",
  Closed: "bg-neutral-700/60 text-neutral-300",
  "Ready to Review": "bg-amber-500/15 text-amber-400",
  Graded: "bg-emerald-500/15 text-emerald-400",
  Skipped: "bg-neutral-700/40 text-neutral-500",
};

export default function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || "bg-neutral-700 text-neutral-300";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
