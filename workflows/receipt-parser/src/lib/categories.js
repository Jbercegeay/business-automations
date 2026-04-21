export const APPROVED_CATEGORIES = [
  "Grocery",
  "Restaurant",
  "Bills",
  "Farm and Animals",
  "Home Improvement",
  "Medical",
];

export function isApprovedCategory(category) {
  const normalized = String(category || "").trim().toLowerCase();
  return APPROVED_CATEGORIES.some((item) => item.toLowerCase() === normalized);
}
