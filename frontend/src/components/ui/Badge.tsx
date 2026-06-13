import clsx from "clsx";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
}

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  primary: "border-[color:var(--primary)]/35 bg-[color:var(--primary)]/12 text-[color:var(--primary-soft)]",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  neutral: "border-white/12 bg-white/6 text-[var(--text-muted)]",
};

const Badge = ({ className, tone = "neutral", ...props }: BadgeProps) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
};

export default Badge;
