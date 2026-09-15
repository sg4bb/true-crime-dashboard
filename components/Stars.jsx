import { Star } from "lucide-react";

export default function Stars({ n = 0 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= n ? "text-amber-600" : "text-neutral-700"}
        />
      ))}
    </div>
  );
}