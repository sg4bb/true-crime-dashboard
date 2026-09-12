"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarDays } from "lucide-react";

function toISO(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromISO(str) {
  if (!str) return undefined;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Every part of the calendar is styled directly with Tailwind classes,
// matching the app's dark theme + amber accent — no default DayPicker CSS
// is imported.
const dayPickerClassNames = {
  months: "flex flex-col",
  month: "space-y-2",
  month_caption: "flex items-center justify-center h-8 text-sm font-medium text-neutral-200",
  nav: "flex items-center justify-between absolute inset-x-1 top-1 h-8 pointer-events-none",
  button_previous:
    "pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors",
  button_next:
    "pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors",
  chevron: "w-4 h-4 fill-current",
  month_grid: "w-full border-collapse mt-1",
  weekdays: "flex",
  weekday: "w-8 h-8 flex items-center justify-center text-[10px] font-semibold text-neutral-600 uppercase",
  week: "flex mt-0.5",
  day: "w-8 h-8 p-0 text-center",
  day_button:
    "w-8 h-8 flex items-center justify-center rounded-md text-xs text-neutral-300 hover:bg-neutral-800 transition-colors",
  today: "text-amber-400 font-semibold",
  selected: "!bg-amber-500 !text-neutral-950 font-semibold hover:!bg-amber-400",
  range_start: "!bg-amber-500 !text-neutral-950 font-semibold rounded-l-md",
  range_end: "!bg-amber-500 !text-neutral-950 font-semibold rounded-r-md",
  range_middle: "!bg-amber-500/15 !text-amber-300 rounded-none",
  outside: "text-neutral-700",
  disabled: "text-neutral-800 opacity-40",
};

export default function DateRangePicker({ from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRange = { from: fromISO(from), to: fromISO(to) };
  const hasRange = Boolean(from || to);

  const label = hasRange
    ? `${from || "Any"} → ${to || "Any"}`
    : "Select date range";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 h-10 px-3 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs transition-colors hover:border-neutral-600 ${
          hasRange ? "text-neutral-200" : "text-neutral-500"
        }`}
      >
        <CalendarDays size={14} className="text-neutral-500" />
        {label}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 p-3 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg shadow-black/40 animate-scale-in">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={(range) => {
              onChange({ from: toISO(range?.from), to: toISO(range?.to) });
            }}
            classNames={dayPickerClassNames}
          />
        </div>
      )}
    </div>
  );
}