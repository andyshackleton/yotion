export const orderToken = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const orderPlan = (plan: string) => plan === "essential" ? "Essential Presence" : "Managed Presence";
export const orderStatus = {
  received: "Website details received",
  preparing: "Preparing your website",
  review: "Ready for your review",
} as const;
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
export const escapeOrderHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[ch] ?? ch));
