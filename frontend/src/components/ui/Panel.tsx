import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

const Panel = ({ className, title, eyebrow, description, actions, children, ...props }: PanelProps) => {
  return (
    <section
      className={clsx(
        "rounded-[32px] border border-white/10 bg-[color:var(--panel)]/90 p-5 shadow-[0_24px_60px_rgba(3,6,12,0.22)] backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {(title || eyebrow || description || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p> : null}
            {title ? <h2 className="text-xl font-semibold tracking-tight text-[var(--text-main)]">{title}</h2> : null}
            {description ? <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
};

export default Panel;
