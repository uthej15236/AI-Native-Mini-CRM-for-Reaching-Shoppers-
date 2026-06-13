interface LoaderProps {
  label?: string;
}

const Loader = ({ label = "Loading..." }: LoaderProps) => {
  return (
    <div className="inline-flex items-center gap-3 text-[var(--text-main)]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--primary)]" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default Loader;

