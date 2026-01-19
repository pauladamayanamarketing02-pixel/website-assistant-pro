export function fileNameFromUrl(url: string) {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1] ?? url;
  return fileName.replace(/^\d+-/, "");
}

export function formatMessageTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function toPreviewText(content: string | null | undefined) {
  const t = (content ?? "").trim();
  if (!t) return null;
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}
