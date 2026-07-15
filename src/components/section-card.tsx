import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[1.5rem] border border-black/5 bg-white/85 p-5 shadow-soft sm:p-6", className)}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}