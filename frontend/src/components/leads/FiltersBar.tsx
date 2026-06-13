import type { ChangeEvent } from "react";
import { LEAD_SOURCES, LEAD_STATUSES, type LeadFilters } from "../../types/lead";
import Button from "../ui/Button";

interface FiltersBarProps {
  filters: LeadFilters;
  onSearchChange: (value: string) => void;
  onFilterChange: (next: Partial<LeadFilters>) => void;
  onReset: () => void;
  onExportCsv: () => void;
  exportDisabled?: boolean;
}

const FiltersBar = ({
  filters,
  onSearchChange,
  onFilterChange,
  onReset,
  onExportCsv,
  exportDisabled,
}: FiltersBarProps) => {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="glass-card mb-4 grid gap-3 p-4 md:grid-cols-6">
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
          Search (name or email)
        </label>
        <input
          value={filters.search}
          onChange={handleSearch}
          placeholder="Start typing to search"
          className="w-full rounded-lg border border-[var(--border-color)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
          Status
        </label>
        <select
          value={filters.status}
          onChange={(event) => onFilterChange({ status: event.target.value as LeadFilters["status"], page: 1 })}
          className="w-full rounded-lg border border-[var(--border-color)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        >
          <option value="all">All Statuses</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
          Source
        </label>
        <select
          value={filters.source}
          onChange={(event) => onFilterChange({ source: event.target.value as LeadFilters["source"], page: 1 })}
          className="w-full rounded-lg border border-[var(--border-color)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        >
          <option value="all">All Sources</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
          Sort
        </label>
        <select
          value={filters.sort}
          onChange={(event) => onFilterChange({ sort: event.target.value as LeadFilters["sort"], page: 1 })}
          className="w-full rounded-lg border border-[var(--border-color)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <div className="flex items-end gap-2 md:justify-end">
        <Button variant="secondary" onClick={onReset}>
          Reset
        </Button>
        <Button onClick={onExportCsv} disabled={exportDisabled}>
          Export CSV
        </Button>
      </div>
    </div>
  );
};

export default FiltersBar;

