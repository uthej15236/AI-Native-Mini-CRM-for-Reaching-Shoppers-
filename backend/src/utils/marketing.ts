export const MS_PER_DAY = 86_400_000;

export const daysBetween = (later: Date, earlier: Date): number => {
  const diff = later.getTime() - earlier.getTime();
  return Math.max(Math.floor(diff / MS_PER_DAY), 0);
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export const safeDivide = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const percentile = (values: number[], percentileValue: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1));
  return sorted[index];
};

export const normalizeObjective = (objective: string): string => objective.trim().replace(/\s+/g, " ").toLowerCase();

export const uniqueBy = <T,>(items: T[], getter: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getter(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

