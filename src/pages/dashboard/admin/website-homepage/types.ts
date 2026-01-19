export type HomepagePromo = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  startsAt?: string | null; // ISO
  endsAt?: string | null; // ISO
  isPublished?: boolean;
};

export type HomepagePromoSettings = {
  promos: HomepagePromo[];
};

export const defaultHomepagePromoSettings: HomepagePromoSettings = {
  promos: [],
};

export function sanitizeHomepagePromoSettings(value: unknown): HomepagePromoSettings {
  if (!value || typeof value !== "object") return defaultHomepagePromoSettings;
  const v = value as any;

  const promos = Array.isArray(v.promos)
    ? v.promos
        .filter(Boolean)
        .map((p: any): HomepagePromo => ({
          id: String(p.id ?? crypto.randomUUID()),
          title: String(p.title ?? ""),
          subtitle: p.subtitle == null ? null : String(p.subtitle),
          ctaLabel: p.ctaLabel == null ? null : String(p.ctaLabel),
          ctaHref: p.ctaHref == null ? null : String(p.ctaHref),
          imageUrl: p.imageUrl == null ? null : String(p.imageUrl),
          imageAlt: p.imageAlt == null ? null : String(p.imageAlt),
          startsAt: p.startsAt == null ? null : String(p.startsAt),
          endsAt: p.endsAt == null ? null : String(p.endsAt),
          isPublished: p.isPublished === false ? false : true,
        }))
        .filter((p: HomepagePromo) => p.title.trim().length > 0)
    : [];

  return { promos };
}
