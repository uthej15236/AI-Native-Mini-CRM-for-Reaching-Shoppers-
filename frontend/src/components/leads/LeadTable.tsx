import { Link } from "react-router-dom";
import clsx from "clsx";
import type { Lead } from "../../types/lead";
import Button from "../ui/Button";

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onCopyEmail: (email: string) => void;
  canDelete: boolean;
}

const badgeBase = "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]";

const statusTone: Record<Lead["status"], string> = {
  New: "border-sky-300/60 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  Contacted: "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  Qualified: "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  Lost: "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200",
};

const sourceTone: Record<Lead["source"], string> = {
  Website: "border-cyan-300/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  Instagram: "border-fuchsia-300/60 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-200",
  Referral: "border-violet-300/60 bg-violet-500/10 text-violet-700 dark:text-violet-200",
};

const LeadTable = ({ leads, onEdit, onDelete, onCopyEmail, canDelete }: LeadTableProps) => {
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));

  return (
    <div className="glass-card overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--bg-accent)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Created At</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id} className="border-t border-[var(--border-color)]">
              <td className="px-4 py-3 font-semibold">{lead.name}</td>
              <td className="px-4 py-3">{lead.email}</td>
              <td className="px-4 py-3">
                <span className={clsx(badgeBase, statusTone[lead.status])}>{lead.status}</span>
              </td>
              <td className="px-4 py-3">
                <span className={clsx(badgeBase, sourceTone[lead.source])}>{lead.source}</span>
              </td>
              <td className="px-4 py-3">{formatDate(lead.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link
                    to={`/dashboard/leads/${lead._id}`}
                    className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 font-semibold hover:bg-[var(--bg-accent)]"
                  >
                    View
                  </Link>
                  <Button variant="secondary" onClick={() => onCopyEmail(lead.email)}>
                    Copy email
                  </Button>
                  <Button variant="secondary" onClick={() => onEdit(lead)}>
                    Edit
                  </Button>
                  {canDelete ? (
                    <Button variant="danger" onClick={() => onDelete(lead)}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;
