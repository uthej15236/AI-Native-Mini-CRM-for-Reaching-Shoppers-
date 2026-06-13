import debounce from "lodash.debounce";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import FiltersBar from "../components/leads/FiltersBar";
import LeadFormModal from "../components/leads/LeadFormModal";
import LeadTable from "../components/leads/LeadTable";
import PaginationControls from "../components/leads/PaginationControls";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Loader from "../components/ui/Loader";
import { createLead, deleteLead, fetchLeads, setFilters, updateLead, resetFilters } from "../features/leads/leadsSlice";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error";
import type { Lead, LeadMutationPayload } from "../types/lead";
import Button from "../components/ui/Button";

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { items, filters, meta, status, error, mutationStatus } = useAppSelector((state) => state.leads);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const debouncedApplySearch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(setFilters({ search: value, page: 1 }));
      }, 450),
    [dispatch]
  );

  useEffect(() => {
    return () => debouncedApplySearch.cancel();
  }, [debouncedApplySearch]);

  useEffect(() => {
    void dispatch(fetchLeads());
  }, [dispatch, filters.page, filters.search, filters.sort, filters.source, filters.status]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedApplySearch(value);
  };

  const handleFilterChange = (next: Partial<typeof filters>) => {
    dispatch(setFilters(next));
  };

  const handleReset = () => {
    debouncedApplySearch.cancel();
    setSearchInput("");
    dispatch(resetFilters());
  };

  const handleCreateClick = () => {
    setModalMode("create");
    setActiveLead(null);
    setModalOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setModalMode("edit");
    setActiveLead(lead);
    setModalOpen(true);
  };

  const handleModalSubmit = async (payload: LeadMutationPayload) => {
    try {
      if (modalMode === "create") {
        await dispatch(createLead(payload)).unwrap();
        toast.success("Lead created");
      } else if (activeLead) {
        await dispatch(updateLead({ leadId: activeLead._id, payload })).unwrap();
        toast.success("Lead updated");
      }

      setModalOpen(false);
      void dispatch(fetchLeads());
    } catch (mutationError) {
      toast.error(String(mutationError));
    }
  };

  const handleDeleteClick = async (lead: Lead) => {
    if (!window.confirm(`Delete lead "${lead.name}"?`)) {
      return;
    }

    try {
      await dispatch(deleteLead(lead._id)).unwrap();
      toast.success("Lead deleted");
      void dispatch(fetchLeads());
    } catch (mutationError) {
      toast.error(String(mutationError));
    }
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied to clipboard");
    } catch {
      toast.error("Could not copy email");
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const params = {
        sort: filters.sort,
        status: filters.status === "all" ? undefined : filters.status,
        source: filters.source === "all" ? undefined : filters.source,
        search: filters.search.trim() || undefined,
      };

      const response = await api.get("/leads/export/csv", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (csvError) {
      toast.error(getErrorMessage(csvError, "CSV export failed"));
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Leads Management</h2>
          <p className="text-sm text-[var(--text-muted)]">Create, track, filter, and update all leads from one place.</p>
        </div>
        <Button onClick={handleCreateClick}>+ Add Lead</Button>
      </div>

      <div className="glass-card mb-4 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Visible leads</p>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Total matches</p>
          <p className="mt-1 text-2xl font-bold">{meta.totalRecords}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Page</p>
          <p className="mt-1 text-2xl font-bold">
            {meta.page}/{meta.totalPages}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Active filters</p>
          <p className="mt-1 text-2xl font-bold">
            {Number(filters.status !== "all") +
              Number(filters.source !== "all") +
              Number(filters.search.trim().length > 0) +
              Number(filters.sort === "oldest")}
          </p>
        </div>
      </div>

      <FiltersBar
        filters={{ ...filters, search: searchInput }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onExportCsv={handleExportCsv}
        exportDisabled={exportingCsv}
      />

      {status === "loading" && items.length === 0 ? (
        <div className="mt-10 flex justify-center">
          <Loader label="Fetching leads..." />
        </div>
      ) : null}

      {status === "failed" && error ? (
        <ErrorState message={error} onRetry={() => void dispatch(fetchLeads())} />
      ) : null}

      {status === "succeeded" && items.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Try changing filters or add a new lead to get started."
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <LeadTable
            leads={items}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onCopyEmail={handleCopyEmail}
            canDelete={user?.role === "admin"}
          />
          <PaginationControls
            meta={meta}
            onPageChange={(page) => {
              dispatch(setFilters({ page }));
            }}
          />
        </>
      ) : null}

      <LeadFormModal
        open={modalOpen}
        mode={modalMode}
        initialLead={activeLead}
        isSubmitting={mutationStatus === "loading"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </section>
  );
};

export default DashboardPage;
