import { Star } from "lucide-react";

export default function Stars({ n = 0 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= n ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
        />
      ))}
    </div>
  );
}
