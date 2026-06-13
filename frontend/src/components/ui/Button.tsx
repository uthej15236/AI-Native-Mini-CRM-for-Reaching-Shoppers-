import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
}

const Button = ({ className, variant = "primary", isLoading, children, disabled, ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-white shadow-[0_14px_32px_rgba(25,168,152,0.24)] hover:translate-y-[-1px] hover:shadow-[0_18px_38px_rgba(25,168,152,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        variant === "secondary" &&
          "border border-[var(--border-color)] bg-white/5 text-[var(--text-main)] hover:border-[var(--primary)] hover:bg-white/8",
        variant === "danger" &&
          "bg-[linear-gradient(135deg,var(--danger),#ff907d)] text-white shadow-[0_14px_32px_rgba(255,104,85,0.22)] hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Working..." : children}
    </button>
  );
};

export default Button;
