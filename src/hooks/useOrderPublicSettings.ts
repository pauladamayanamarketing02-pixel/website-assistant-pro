import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type OrderTemplate = {
  id: string;
  name: string;
  category: "business" | "portfolio" | "service" | "agency";
  is_active?: boolean;
  sort_order?: number;
};

export type OrderContactSettings = {
  heading: string;
  description?: string;
  whatsapp_phone?: string;
  whatsapp_message?: string;
  email?: string;
};

const SETTINGS_TEMPLATES_KEY = "order_templates";
const SETTINGS_CONTACT_KEY = "order_contact";

const fallbackTemplates: OrderTemplate[] = [
  { id: "t1", name: "Modern Business", category: "business" },
  { id: "t2", name: "Creative Portfolio", category: "portfolio" },
  { id: "t3", name: "Local Services", category: "service" },
  { id: "t4", name: "Studio Agency", category: "agency" },
  { id: "t5", name: "Clean Services", category: "service" },
  { id: "t6", name: "Bold Business", category: "business" },
];

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeNumber(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseTemplates(value: unknown): OrderTemplate[] {
  if (!Array.isArray(value)) return fallbackTemplates;
  const normalized = value
    .map((raw) => {
      const obj = raw as any;
      const id = safeString(obj?.id).trim();
      const name = safeString(obj?.name).trim();
      const category = safeString(obj?.category) as OrderTemplate["category"];
      const is_active = typeof obj?.is_active === "boolean" ? obj.is_active : true;
      const sort_order = safeNumber(obj?.sort_order);
      if (!id || !name) return null;
      if (!(["business", "portfolio", "service", "agency"] as const).includes(category)) return null;
      return { id, name, category, is_active, sort_order } satisfies OrderTemplate;
    })
    .filter(Boolean) as OrderTemplate[];

  return normalized.length ? normalized : fallbackTemplates;
}

function parseContact(value: unknown): OrderContactSettings {
  const obj = (value ?? {}) as any;
  const heading = safeString(obj?.heading).trim() || "Butuh bantuan?";
  const description = safeString(obj?.description).trim() || "Hubungi kami untuk bantuan order.";
  const whatsapp_phone = safeString(obj?.whatsapp_phone).trim();
  const whatsapp_message = safeString(obj?.whatsapp_message).trim();
  const email = safeString(obj?.email).trim();
  return { heading, description, whatsapp_phone, whatsapp_message, email };
}

function extractTld(domain: string): string | null {
  const d = (domain ?? "").trim().toLowerCase();
  if (!d.includes(".")) return null;
  const tld = d.split(".").pop() ?? "";
  const normalized = tld.replace(/^\./, "");
  return normalized || null;
}

function normalizeTldForRow(tld: string): string {
  return (tld ?? "").trim().toLowerCase().replace(/^\./, "");
}

export function useOrderPublicSettings(domain?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<OrderTemplate[]>(fallbackTemplates);
  const [contact, setContact] = useState<OrderContactSettings>(() => parseContact(null));

  const [defaultPackageId, setDefaultPackageId] = useState<string | null>(null);
  const [tldPrices, setTldPrices] = useState<Array<{ tld: string; price_usd: number }>>([]);

  const tld = useMemo(() => (domain ? extractTld(domain) : null), [domain]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: tplRow }, { data: contactRow }] = await Promise.all([
          (supabase as any).from("website_settings").select("value").eq("key", SETTINGS_TEMPLATES_KEY).maybeSingle(),
          (supabase as any).from("website_settings").select("value").eq("key", SETTINGS_CONTACT_KEY).maybeSingle(),
        ]);

        setTemplates(parseTemplates(tplRow?.value));
        setContact(parseContact(contactRow?.value));

        const { data: pricingRow } = await (supabase as any)
          .from("domain_pricing_settings")
          .select("default_package_id")
          .eq("id", true)
          .maybeSingle();
        const pkgId = (pricingRow as any)?.default_package_id ?? null;
        setDefaultPackageId(pkgId);

        if (pkgId) {
          const { data: prices } = await (supabase as any)
            .from("domain_tld_prices")
            .select("tld,price_usd")
            .eq("package_id", pkgId);
          setTldPrices(
            Array.isArray(prices)
              ? prices
                  .map((p: any) => ({ tld: normalizeTldForRow(p?.tld), price_usd: Number(p?.price_usd ?? 0) }))
                  .filter((p: any) => p.tld)
              : [],
          );
        } else {
          setTldPrices([]);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Gagal memuat order settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const domainPriceUsd = useMemo(() => {
    if (!tld) return null;
    const row = tldPrices.find((p) => p.tld === normalizeTldForRow(tld));
    if (!row) return null;
    return Number.isFinite(row.price_usd) ? row.price_usd : null;
  }, [tld, tldPrices]);

  return {
    loading,
    error,
    templates: templates
      .filter((t) => t.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    contact,
    pricing: {
      defaultPackageId,
      tldPrices,
      domainPriceUsd,
      domainTld: tld,
    },
  };
}
