import { useEffect, useState, type FormEvent } from "react";
import Button from "../ui/Button";
import InputField from "../ui/InputField";
import Panel from "../ui/Panel";
import SelectField from "../ui/SelectField";
import type { Channel, CustomerRecord, CustomerUpsertPayload, LoyaltyTier } from "../../types/xeno";

interface CustomerEditorModalProps {
  open: boolean;
  mode: "create" | "edit";
  customer: CustomerRecord | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CustomerUpsertPayload) => void;
}

interface CustomerDraft {
  name: string;
  email: string;
  phone: string;
  preferredChannel: Channel;
  totalSpend: string;
  lastOrderDate: string;
  city: string;
  loyaltyTier: LoyaltyTier;
  tags: string;
}

const channelOptions: Array<{ label: string; value: Channel }> = [
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "SMS", value: "SMS" },
  { label: "Email", value: "Email" },
];

const tierOptions: Array<{ label: string; value: LoyaltyTier }> = [
  { label: "Bronze", value: "Bronze" },
  { label: "Silver", value: "Silver" },
  { label: "Gold", value: "Gold" },
  { label: "Platinum", value: "Platinum" },
];

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const emptyDraft = (): CustomerDraft => ({
  name: "",
  email: "",
  phone: "",
  preferredChannel: "WhatsApp",
  totalSpend: "0",
  lastOrderDate: todayInputValue(),
  city: "",
  loyaltyTier: "Bronze",
  tags: "",
});

const draftFromCustomer = (customer: CustomerRecord): CustomerDraft => ({
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  preferredChannel: customer.preferredChannel,
  totalSpend: String(customer.totalSpend),
  lastOrderDate: toDateInputValue(customer.lastOrderDate),
  city: customer.city,
  loyaltyTier: customer.loyaltyTier,
  tags: customer.tags.join(", "),
});

const CustomerEditorModal = ({ open, mode, customer, isSaving, error, onClose, onSubmit }: CustomerEditorModalProps) => {
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft());

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(customer ? draftFromCustomer(customer) : emptyDraft());
  }, [customer, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tagList = draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      preferredChannel: draft.preferredChannel,
      totalSpend: Number(draft.totalSpend || 0),
      lastOrderDate: draft.lastOrderDate,
      city: draft.city.trim(),
      loyaltyTier: draft.loyaltyTier,
      tags: tagList,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-xl"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Panel className="w-full max-w-4xl border-white/15 bg-[color:var(--panel)]/98 shadow-[0_36px_90px_rgba(0,0,0,0.45)]">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              {mode === "create" ? "Add customer" : "Edit customer"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
              {mode === "create" ? "Create a new customer profile" : "Update the selected customer"}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Customer code is generated automatically. Deleting a customer keeps campaign history intact and removes the profile from active lists.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </header>

        {error ? <p className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">{error}</p> : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <InputField
              label="Name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ananya Rao"
              required
            />
            <InputField
              label="Email"
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="ananya.rao@northstar.in"
              required
            />
            <InputField
              label="Phone"
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+91 98765 12001"
              required
            />
            <InputField
              label="City"
              value={draft.city}
              onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
              placeholder="Bengaluru"
              required
            />
            <SelectField
              label="Preferred channel"
              value={draft.preferredChannel}
              onChange={(event) => setDraft((current) => ({ ...current, preferredChannel: event.target.value as Channel }))}
              options={channelOptions}
            />
            <SelectField
              label="Loyalty tier"
              value={draft.loyaltyTier}
              onChange={(event) => setDraft((current) => ({ ...current, loyaltyTier: event.target.value as LoyaltyTier }))}
              options={tierOptions}
            />
            <InputField
              label="Total spend"
              type="number"
              min="0"
              step="1"
              value={draft.totalSpend}
              onChange={(event) => setDraft((current) => ({ ...current, totalSpend: event.target.value }))}
              placeholder="9200"
              required
            />
            <InputField
              label="Last order date"
              type="date"
              value={draft.lastOrderDate}
              onChange={(event) => setDraft((current) => ({ ...current, lastOrderDate: event.target.value }))}
              required
            />
          </div>

          <InputField
            label="Tags"
            value={draft.tags}
            onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
            placeholder="vip, mobile-first, repeat-buyer"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-sm text-[var(--text-muted)]">
              Tip: keep tags short and campaign-friendly. They are used by the AI copilot for segmentation.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {mode === "create" ? "Create customer" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </Panel>
    </div>
  );
};

export default CustomerEditorModal;
