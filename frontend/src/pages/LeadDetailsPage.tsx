import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearSelectedLead, fetchLeadById } from "../features/leads/leadsSlice";
import ErrorState from "../components/ui/ErrorState";
import Loader from "../components/ui/Loader";
import { LEAD_SOURCES, LEAD_STATUSES } from "../types/lead";

const badgeBase = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]";

const statusTone: Record<(typeof LEAD_STATUSES)[number], string> = {
  New: "border-sky-300/60 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  Contacted: "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  Qualified: "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  Lost: "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200",
};

const sourceTone: Record<(typeof LEAD_SOURCES)[number], string> = {
  Website: "border-cyan-300/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  Instagram: "border-fuchsia-300/60 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-200",
  Referral: "border-violet-300/60 bg-violet-500/10 text-violet-700 dark:text-violet-200",
};

const LeadDetailsPage = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const dispatch = useAppDispatch();
  const { selectedLead, detailsStatus, error } = useAppSelector((state) => state.leads);

  useEffect(() => {
    if (leadId) {
      void dispatch(fetchLeadById(leadId));
    }

    return () => {
      dispatch(clearSelectedLead());
    };
  }, [dispatch, leadId]);

  if (detailsStatus === "loading") {
    return (
      <div className="mt-10 flex justify-center">
        <Loader label="Loading lead details..." />
      </div>
    );
  }

  if (detailsStatus === "failed" && error) {
    return <ErrorState message={error} onRetry={() => leadId && void dispatch(fetchLeadById(leadId))} />;
  }

  if (!selectedLead) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold">Lead not found</h2>
        <Link to="/dashboard" className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));

  return (
    <section className="space-y-4">
      <Link to="/dashboard" className="text-sm font-semibold text-[var(--primary)]">
        Back to dashboard
      </Link>
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedLead.email}</p>
            <a href={`mailto:${selectedLead.email}`} className="mt-2 inline-flex text-sm font-semibold text-[var(--primary)]">
              Email lead
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`${badgeBase} ${statusTone[selectedLead.status]}`}>{selectedLead.status}</span>
            <span className={`${badgeBase} ${sourceTone[selectedLead.source]}`}>{selectedLead.source}</span>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Status</dt>
            <dd className="mt-1 text-lg font-semibold">{selectedLead.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Source</dt>
            <dd className="mt-1 text-lg font-semibold">{selectedLead.source}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Created At</dt>
            <dd className="mt-1 text-base font-medium">{formatDate(selectedLead.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Updated At</dt>
            <dd className="mt-1 text-base font-medium">{formatDate(selectedLead.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
};

export default LeadDetailsPage;
