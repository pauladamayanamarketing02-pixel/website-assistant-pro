// NOTE: profiles.status historically stores assistant state as:
// - active | inactive | pending
// Some UI/legacy code may also use: nonactive
export function formatAssistStatusLabel(status: string | null | undefined): "Active" | "Nonactive" | "Pending" | "—" {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "active") return "Active";
  if (s === "inactive" || s === "nonactive") return "Nonactive";
  if (s === "pending") return "Pending";
  if (!s) return "—";
  return "—";
}

export function assistStatusBadgeVariant(
  status: string | null | undefined
): "success" | "muted" | "warning" {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "active") return "success";
  if (s === "pending") return "warning";
  // inactive | nonactive
  return "muted";
}
