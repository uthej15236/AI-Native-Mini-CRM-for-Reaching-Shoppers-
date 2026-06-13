import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = ({ label, error, className, ...props }: InputFieldProps) => {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--text-main)]">{label}</span>
      <input
        className={clsx(
          "w-full rounded-2xl border border-[var(--border-color)] bg-[color:var(--panel)]/85 px-4 py-3 text-sm text-[var(--text-main)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
    </label>
  );
};

export default InputField;
