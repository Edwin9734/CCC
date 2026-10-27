import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  helper,
  tone = "neutral"
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const toneClasses = {
    neutral: "bg-white/90",
    good: "bg-emerald-50",
    warning: "bg-amber-50",
    danger: "bg-rose-50"
  };

  return (
    <article className={cn("ab-card rounded-[1.75rem] p-5", toneClasses[tone])}>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{helper}</p>
    </article>
  );
}