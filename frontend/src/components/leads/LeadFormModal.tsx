import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LEAD_SOURCES, LEAD_STATUSES, type Lead, type LeadMutationPayload } from "../../types/lead";
import Button from "../ui/Button";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";

const leadFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  status: z.enum(LEAD_STATUSES),
  source: z.enum(LEAD_SOURCES),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialLead?: Lead | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: LeadMutationPayload) => Promise<void>;
}

const defaultValues: LeadFormValues = {
  name: "",
  email: "",
  status: "New",
  source: "Website",
};

const LeadFormModal = ({ open, mode, initialLead, isSubmitting, onClose, onSubmit }: LeadFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialLead) {
      reset({
        name: initialLead.name,
        email: initialLead.email,
        status: initialLead.status,
        source: initialLead.source,
      });
      return;
    }

    reset(defaultValues);
  }, [initialLead, mode, open, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="glass-card w-full max-w-lg p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 id="lead-form-title" className="text-xl font-bold">
              {mode === "create" ? "Create Lead" : "Update Lead"}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">Fill the form and submit.</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-[var(--border-color)] px-2 py-1 text-xs font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <InputField label="Name" placeholder="Lead full name" error={errors.name?.message} {...register("name")} />
          <InputField label="Email" placeholder="lead@example.com" error={errors.email?.message} {...register("email")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Status"
              error={errors.status?.message}
              options={LEAD_STATUSES.map((status) => ({ value: status, label: status }))}
              {...register("status")}
            />
            <SelectField
              label="Source"
              error={errors.source?.message}
              options={LEAD_SOURCES.map((source) => ({ value: source, label: source }))}
              {...register("source")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === "create" ? "Create Lead" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
