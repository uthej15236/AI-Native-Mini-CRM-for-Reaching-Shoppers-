import type { LeadsMeta } from "../../types/lead";
import Button from "../ui/Button";

interface PaginationControlsProps {
  meta: LeadsMeta;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({ meta, onPageChange }: PaginationControlsProps) => {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
      <p className="text-sm text-[var(--text-muted)]">
        Page <span className="font-semibold text-[var(--text-main)]">{meta.page}</span> of{" "}
        <span className="font-semibold text-[var(--text-main)]">{meta.totalPages}</span> ({meta.totalRecords} records)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevPage}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;

