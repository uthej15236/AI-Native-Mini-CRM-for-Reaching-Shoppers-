import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
}

const SelectField = ({ label, error, options, className, ...props }: SelectFieldProps) => {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--text-main)]">{label}</span>
      <select
        className={clsx(
          "w-full rounded-2xl border border-[var(--border-color)] bg-[color:var(--panel)]/85 px-4 py-3 text-sm text-[var(--text-main)] outline-none transition duration-200",
          "focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
    </label>
  );
};

export default SelectField;
