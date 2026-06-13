import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { getStoredTheme, setStoredTheme } from "../../lib/storage";
import Button from "../ui/Button";

const AppShell = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [theme, setTheme] = useState<"light" | "dark">(getStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setStoredTheme(theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6">
      <header className="glass-card mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Xeno CRM</p>
          <h1 className="mt-1 text-2xl font-bold">Smart Leads Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Track, qualify, and move leads without losing context.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-semibold hover:bg-[var(--bg-accent)]"
          >
            Dashboard
          </Link>
          <button
            type="button"
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-semibold hover:bg-[var(--bg-accent)]"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-accent)] px-3 py-2 text-sm">
            <p className="font-semibold">{user?.fullName}</p>
            <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role}</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
