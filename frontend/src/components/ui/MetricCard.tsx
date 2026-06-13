import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: string;
  accent?: string;
}

const MetricCard = ({ label, value, detail, accent }: MetricCardProps) => {
  return (
    <article className="group rounded-[28px] border border-white/10 bg-[color:var(--panel)]/88 p-5 shadow-[0_20px_50px_rgba(4,8,14,0.22)] transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary)]/30">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-[var(--text-main)]">{value}</p>
          {detail ? <p className="max-w-xs text-sm leading-6 text-[var(--text-muted)]">{detail}</p> : null}
        </div>
        {accent ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-lg text-[var(--primary-soft)]">
            {accent}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default MetricCard;
