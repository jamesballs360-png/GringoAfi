export function formatMoney(amount: number, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function daysBetween(a: string | Date, b: string | Date) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function statusTone(status: string) {
  switch (status) {
    case "approved":
    case "completed":
    case "active":
      return "text-pine-600 bg-pine-50";
    case "pending":
      return "text-gold-600 bg-gold-100";
    case "rejected":
    case "failed":
    case "cancelled":
      return "text-clay bg-red-50";
    default:
      return "text-muted bg-line";
  }
}
