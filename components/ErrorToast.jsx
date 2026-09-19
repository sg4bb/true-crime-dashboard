"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Amber error toast, bottom-right, auto-dismissing.
 * Usage: const toastRef = useRef(null); ... toastRef.current?.trigger();
 * <ErrorToast ref={toastRef} />
 */
const ErrorToast = forwardRef(function ErrorToast(
  { title = "Oops!", message = "Try again in a few seconds", duration = 1700 },
  ref
) {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  function dismiss() {
    clearTimeout(timeoutRef.current);
    setLeaving(true);
    leaveTimeoutRef.current = setTimeout(() => {
      setShow(false);
      setLeaving(false);
    }, 200);
  }

  useImperativeHandle(ref, () => ({
    trigger() {
      clearTimeout(timeoutRef.current);
      clearTimeout(leaveTimeoutRef.current);
      setLeaving(false);
      setShow(true);
      timeoutRef.current = setTimeout(dismiss, duration);
    },
    dismiss,
  }));

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[60] w-full max-w-sm ${
        leaving ? "animate-fade-out-down" : "animate-fade-in-up"
      }`}
    >
      <div className="flex items-start gap-3 rounded-xl bg-amber-500 px-4 py-3.5 shadow-lg shadow-black/30">
        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shrink-0 mt-0.5">
          <X size={12} className="text-white" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-sm text-white/90">{message}</p>
        </div>
      </div>
    </div>
  );
});

export default ErrorToast;