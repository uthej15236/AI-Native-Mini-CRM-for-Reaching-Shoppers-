import Button from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <div className="glass-card border-[var(--danger)] p-8 text-center">
      <h3 className="text-xl font-semibold text-[var(--danger)]">Something went wrong</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
};

export default ErrorState;

