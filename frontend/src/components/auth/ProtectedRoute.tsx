import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import type { UserRole } from "../../types/auth";
import Loader from "../ui/Loader";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { token, user, status } = useAppSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user && status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader label="Loading account..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto mt-20 max-w-xl rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
        <h2 className="text-2xl font-semibold">Access denied</h2>
        <p className="mt-2 text-[var(--text-muted)]">
          Your role does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

