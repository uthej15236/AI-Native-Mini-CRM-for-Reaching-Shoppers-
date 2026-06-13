import clsx from "clsx";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/copilot", label: "AI Copilot" },
  { to: "/customers", label: "Customers" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/timeline", label: "Timeline" },
];

const XenoShell = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(63,208,190,0.2),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,186,102,0.16),transparent_28%),linear-gradient(180deg,#071318_0%,#0b1720_45%,#081119_100%)]" />
      <div className="absolute inset-x-0 top-[-12rem] -z-10 h-[28rem] bg-[radial-gradient(circle,rgba(63,208,190,0.14),transparent_65%)] blur-3xl" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-5 p-4 md:flex-row md:p-6">
        <aside className="hidden w-[310px] shrink-0 flex-col justify-between rounded-[36px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(2,6,12,0.3)] backdrop-blur-xl md:flex">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--primary)]/25 bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary-soft)]">
                Xeno Copilot
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-main)]">Turn business goals into campaigns.</h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
                  A chat-first marketing copilot that builds the audience, chooses the channel, launches the campaign, and reads the callback stream.
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center justify-between rounded-[22px] border px-4 py-3 text-sm font-semibold transition duration-200",
                      isActive
                        ? "border-[color:var(--primary)]/35 bg-[color:var(--primary)]/12 text-[var(--text-main)] shadow-[0_18px_36px_rgba(16,121,109,0.18)]"
                        : "border-white/8 bg-white/[0.03] text-[var(--text-muted)] hover:border-white/15 hover:bg-white/[0.05] hover:text-[var(--text-main)]"
                    )
                  }
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Open</span>
                </NavLink>
              ))}
            </nav>

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,24,30,0.8),rgba(8,18,24,0.55))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Demo flow</p>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-main)]">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)]/18 text-xs font-bold text-[var(--primary-soft)]">1</span>
                  Ask the copilot for a segment or campaign goal.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)]/18 text-xs font-bold text-[var(--primary-soft)]">2</span>
                  Review the AI reasoning, copy variants, and audience preview.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)]/18 text-xs font-bold text-[var(--primary-soft)]">3</span>
                  Launch and watch the channel service callbacks update live.
                </li>
              </ol>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Architecture</p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-main)]">
              CRM, AI copilot, and channel simulator are separated on purpose so the callbacks, retries, and idempotency story is easy to explain in the interview.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="rounded-[32px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_20px_48px_rgba(2,6,12,0.26)] backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Xeno Copilot</p>
                <h1 className="mt-1 text-lg font-semibold text-[var(--text-main)]">Turn business goals into campaigns.</h1>
              </div>
              <span className="rounded-full border border-[color:var(--primary)]/25 bg-[color:var(--primary)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary-soft)]">
                Live
              </span>
            </div>
            <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "rounded-2xl border px-3 py-2 text-center text-xs font-semibold transition",
                      isActive
                        ? "border-[color:var(--primary)]/35 bg-[color:var(--primary)]/12 text-[var(--text-main)]"
                        : "border-white/8 bg-white/[0.03] text-[var(--text-muted)]"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default XenoShell;
