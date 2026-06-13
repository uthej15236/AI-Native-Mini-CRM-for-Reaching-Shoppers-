import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import InputField from "../components/ui/InputField";
import MetricCard from "../components/ui/MetricCard";
import Panel from "../components/ui/Panel";
import SelectField from "../components/ui/SelectField";
import CustomerEditorModal from "../components/customers/CustomerEditorModal";
import { formatCurrency, formatDateTime, relativeDays } from "../lib/format";
import { xenoApi } from "../lib/xenoApi";
import type { Channel, CustomerDetail, CustomerRecord, CustomerUpsertPayload, LoyaltyTier } from "../types/xeno";

const channelOptions: Array<{ label: string; value: Channel | "all" }> = [
  { label: "All channels", value: "all" },
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "SMS", value: "SMS" },
  { label: "Email", value: "Email" },
];

const tierOptions: Array<{ label: string; value: LoyaltyTier | "all" }> = [
  { label: "All tiers", value: "all" },
  { label: "Bronze", value: "Bronze" },
  { label: "Silver", value: "Silver" },
  { label: "Gold", value: "Gold" },
  { label: "Platinum", value: "Platinum" },
];

const channelTone = (channel: Channel) => {
  if (channel === "WhatsApp") {
    return "primary";
  }

  if (channel === "SMS") {
    return "warning";
  }

  return "neutral";
};

const emptyDetail = (): CustomerDetail | null => null;

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [preferredChannel, setPreferredChannel] = useState<Channel | "all">("all");
  const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyTier | "all">("all");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMutation, setLoadingMutation] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshCustomersTick, setRefreshCustomersTick] = useState(0);
  const [refreshDetailTick, setRefreshDetailTick] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorCustomer, setEditorCustomer] = useState<CustomerRecord | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let alive = true;

    const timer = window.setTimeout(() => {
      const loadCustomers = async () => {
        try {
          setLoadingCustomers(true);
          const data = await xenoApi.getCustomers({
            search,
            preferredChannel,
            loyaltyTier,
          });

          if (!alive) {
            return;
          }

          setCustomers(data);
          setError(null);
          setSelectedCustomerId((current) => {
            if (current && data.some((customer) => customer.customerId === current)) {
              return current;
            }

            return data[0]?.customerId ?? null;
          });
        } catch (loadError) {
          if (!alive) {
            return;
          }

          const message = loadError instanceof Error ? loadError.message : "Could not load the customer list.";
          setError(message);
          setCustomers([]);
        } finally {
          if (alive) {
            setLoadingCustomers(false);
          }
        }
      };

      void loadCustomers();
    }, 220);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [loyaltyTier, preferredChannel, refreshCustomersTick, search]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(emptyDetail());
      return;
    }

    let alive = true;

    const loadCustomerDetail = async () => {
      try {
        setLoadingDetail(true);
        const data = await xenoApi.getCustomerById(selectedCustomerId);
        if (!alive) {
          return;
        }

        setSelectedCustomer(data);
      } catch {
        if (!alive) {
          return;
        }

        setSelectedCustomer(emptyDetail());
      } finally {
        if (alive) {
          setLoadingDetail(false);
        }
      }
    };

    void loadCustomerDetail();

    return () => {
      alive = false;
    };
  }, [refreshDetailTick, selectedCustomerId]);

  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const averageSpend = customers.length > 0 ? totalSpend / customers.length : 0;
  const dormantCount = customers.filter((customer) => customer.daysSinceLastOrder >= 30).length;
  const whatsappShare = customers.length > 0 ? customers.filter((customer) => customer.preferredChannel === "WhatsApp").length / customers.length : 0;

  const selected = selectedCustomer?.customer ?? customers.find((customer) => customer.customerId === selectedCustomerId) ?? null;

  const openCreateModal = () => {
    setEditorMode("create");
    setEditorCustomer(null);
    setMutationError(null);
    setEditorOpen(true);
  };

  const openEditModal = () => {
    if (!selected) {
      return;
    }

    setEditorMode("edit");
    setEditorCustomer(selected);
    setMutationError(null);
    setEditorOpen(true);
  };

  const handleSaveCustomer = async (payload: CustomerUpsertPayload) => {
    setLoadingMutation(true);
    setMutationError(null);

    try {
      if (editorMode === "create") {
        const created = await xenoApi.createCustomer(payload);
        setNotice(`Created ${created.name} and added the profile to the live audience.`);
        setSelectedCustomerId(created.customerId);
      } else if (editorCustomer) {
        const updated = await xenoApi.updateCustomer(editorCustomer.customerId, payload);
        setNotice(`Updated ${updated.name}.`);
        setSelectedCustomer((current) => {
          if (!current || current.customer.customerId !== updated.customerId) {
            return current;
          }

          return {
            ...current,
            customer: updated,
          };
        });
      }

      setEditorOpen(false);
      setRefreshCustomersTick((current) => current + 1);
      setRefreshDetailTick((current) => current + 1);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save the customer.";
      setMutationError(message);
    } finally {
      setLoadingMutation(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selected) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this customer from the active audience? Historical campaign data will remain intact."
    );

    if (!confirmed) {
      return;
    }

    setDeletingCustomerId(selected.customerId);
    setMutationError(null);

    try {
      await xenoApi.deleteCustomer(selected.customerId);
      setNotice(`Deleted ${selected.name} from the active customer list.`);
      setSelectedCustomer(null);
      setSelectedCustomerId(null);
      setRefreshCustomersTick((current) => current + 1);
      setRefreshDetailTick((current) => current + 1);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Could not delete the customer.";
      setMutationError(message);
    } finally {
      setDeletingCustomerId(null);
    }
  };

  return (
    <section className="space-y-5 pb-8">
      <Panel
        title="Customers"
        eyebrow="Audience intelligence"
        description="Search the audience, segment by channel or loyalty tier, inspect the order trail, and now create, edit, or delete active customer profiles."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRefreshCustomersTick((current) => current + 1)} isLoading={loadingCustomers}>
              Refresh list
            </Button>
            <Button onClick={openCreateModal}>Add customer</Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Visible customers" value={customers.length} detail="Matches the current search and filter set." />
          <MetricCard label="Average spend" value={formatCurrency(averageSpend)} detail="Calculated from the currently visible customers." />
          <MetricCard label="Dormant" value={dormantCount} detail="Customers who have not ordered in 30 days or more." />
          <MetricCard
            label="WhatsApp preference"
            value={`${Math.round(whatsappShare * 100)}%`}
            detail="Share of the visible audience that prefers WhatsApp."
          />
        </div>
      </Panel>

      {notice ? (
        <div className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-50">
          {notice}
        </div>
      ) : null}

      {mutationError ? (
        <div className="rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-50">{mutationError}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Audience" eyebrow="Filters and search" description="Keep the search focused. The backend handles the filter logic so the list stays fast and predictable.">
          <div className="grid gap-3 lg:grid-cols-3">
            <InputField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, city, or tag" />
            <SelectField
              label="Preferred channel"
              value={preferredChannel}
              onChange={(event) => setPreferredChannel(event.target.value as Channel | "all")}
              options={channelOptions}
            />
            <SelectField
              label="Loyalty tier"
              value={loyaltyTier}
              onChange={(event) => setLoyaltyTier(event.target.value as LoyaltyTier | "all")}
              options={tierOptions}
            />
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">{error}</p> : null}

          <div className="mt-5 space-y-3">
            {loadingCustomers ? (
              <div className="rounded-[26px] border border-white/8 bg-white/[0.04] p-5 text-sm text-[var(--text-muted)]">Loading customers...</div>
            ) : null}

            {customers.map((customer) => (
              <button
                key={customer.customerId}
                type="button"
                onClick={() => setSelectedCustomerId(customer.customerId)}
                className={`w-full rounded-[28px] border p-4 text-left transition duration-200 ${
                  customer.customerId === selectedCustomerId
                    ? "border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10"
                    : "border-white/8 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={channelTone(customer.preferredChannel)}>{customer.preferredChannel}</Badge>
                      <Badge tone="neutral">{customer.loyaltyTier}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">{customer.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {customer.email} / {customer.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Spend</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--text-main)]">{formatCurrency(customer.totalSpend)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>{customer.orderCount} orders</span>
                  <span>/</span>
                  <span>{relativeDays(customer.daysSinceLastOrder)}</span>
                  <span>/</span>
                  <span>{customer.tags.join(", ")}</span>
                </div>
              </button>
            ))}

            {!loadingCustomers && customers.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
                No customers matched the current filters.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Customer profile"
          eyebrow="Order history"
          description="Click a customer to inspect the profile, edit the profile, or delete it from active targeting without losing the campaign timeline."
          actions={
            selected ? (
              <>
                <Button variant="secondary" onClick={openEditModal} disabled={loadingDetail}>
                  Edit customer
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteCustomer}
                  isLoading={deletingCustomerId === selected.customerId}
                  disabled={loadingDetail || deletingCustomerId === selected.customerId}
                >
                  Delete customer
                </Button>
              </>
            ) : null
          }
        >
          {loadingDetail ? (
            <div className="rounded-[26px] border border-white/8 bg-white/[0.04] p-5 text-sm text-[var(--text-muted)]">Loading customer detail...</div>
          ) : selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={channelTone(selected.preferredChannel)}>{selected.preferredChannel}</Badge>
                    <Badge tone="neutral">{selected.loyaltyTier}</Badge>
                  </div>
                  <h3 className="text-2xl font-semibold text-[var(--text-main)]">{selected.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{selected.email}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Lifetime spend</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">{formatCurrency(selected.totalSpend)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Last order</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">{formatDateTime(selected.lastOrderDate)}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{relativeDays(selected.daysSinceLastOrder)}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Contact</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">{selected.phone}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{selected.city}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Order history</p>
                <div className="space-y-2">
                  {selectedCustomer?.orders.map((order) => (
                    <div key={order.orderId} className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-main)]">{order.category}</p>
                          <p className="text-xs text-[var(--text-muted)]">{order.orderId}</p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">{formatCurrency(order.amount)}</p>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">{formatDateTime(order.timestamp)}</p>
                    </div>
                  ))}
                </div>

                {selectedCustomer && selectedCustomer.orders.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] p-4 text-sm text-[var(--text-muted)]">
                    This profile has no order history yet.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
              Pick a customer from the list to inspect the profile and order history.
            </div>
          )}
        </Panel>
      </div>

      <CustomerEditorModal
        open={editorOpen}
        mode={editorMode}
        customer={editorCustomer}
        isSaving={loadingMutation}
        error={mutationError}
        onClose={() => {
          setEditorOpen(false);
          setMutationError(null);
        }}
        onSubmit={handleSaveCustomer}
      />
    </section>
  );
};

export default CustomersPage;
