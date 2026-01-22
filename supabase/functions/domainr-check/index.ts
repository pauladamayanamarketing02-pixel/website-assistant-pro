// Supabase Edge Function: domainr-check
// Checks domain availability using Domainr API and returns status + (fallback) pricing.
//
// Notes:
// - Domainr API itself does not provide registrar checkout pricing in the public docs.
//   We return a simple per-TLD pricing map for popular TLDs so the UI can show a price.
//   (Can be replaced later with a registrar pricing API.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DomainrStatusRow = {
  domain: string;
  zone?: string;
  status?: string;
  summary?: string;
};

type CheckRequest = {
  query: string;
};

function normalizeQuery(raw: string) {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/\s+/g, "");
  return v;
}

function stripTld(domainOrLabel: string) {
  const v = normalizeQuery(domainOrLabel);
  if (!v) return "";
  return v.split(".")[0];
}

function buildCandidates(base: string, tlds: string[]) {
  const name = stripTld(base);
  if (!name) return [];
  const variants = [name, `${name}hq`, `get${name}`, `${name}app`];
  const out: string[] = [];
  for (const v of variants) {
    for (const t of tlds) {
      out.push(`${v}${t}`);
      if (out.length >= 12) return out;
    }
  }
  return out;
}

function summarizeToUiStatus(summary?: string, status?: string) {
  const s = `${summary ?? ""} ${status ?? ""}`.toLowerCase();
  // Heuristics per Domainr docs examples: summary often "inactive" / "active".
  if (s.includes("premium")) return "premium" as const;
  if (s.includes("inactive") || s.includes("undelegated")) return "available" as const;
  if (s.includes("active") || s.includes("delegated")) return "unavailable" as const;
  return "unknown" as const;
}

const POPULAR_TLDS = [".com", ".net", ".co", ".id", ".org"]; // per user request: multi TLD populer
const DEFAULT_PRICES_USD: Record<string, number> = {
  ".com": 14.99,
  ".net": 16.99,
  ".co": 32.99,
  ".id": 19.99,
  ".org": 12.99,
};

async function getDomainrApiKey(admin: any) {
  const { data: row, error } = await admin
    .from("integration_secrets")
    .select("ciphertext,iv")
    .eq("provider", "domainr")
    .eq("name", "api_key")
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const ciphertext = String((row as any).ciphertext ?? "");
  const iv = String((row as any).iv ?? "");
  if (!ciphertext || !iv) return null;
  if (iv !== "plain") {
    const err = new Error("Domainr API key harus disimpan plaintext (iv='plain')");
    (err as any).status = 400;
    throw err;
  }
  return ciphertext;
}

async function domainrStatus(domains: string[], apiKey: string) {
  const qs = encodeURIComponent(domains.join(","));

  // Domainr docs use `client_id`. Many users store their Domainr API key as client_id.
  // If you are using a different authentication scheme, adjust accordingly.
  const url = `https://api.domainr.com/v2/status?domain=${qs}&client_id=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Domainr error (${res.status}): ${txt || res.statusText}`);
  }
  const json = (await res.json()) as { status?: DomainrStatusRow[] };
  return json.status ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CheckRequest;
    const query = normalizeQuery(body?.query);
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const apiKey = await getDomainrApiKey(admin);
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Domainr API key belum diset (domainr/api_key)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidates = buildCandidates(query, POPULAR_TLDS);
    const statusRows = await domainrStatus(candidates, apiKey);
    const byDomain = new Map(statusRows.map((r) => [String(r.domain).toLowerCase(), r]));

    const items = candidates.map((d) => {
      const r = byDomain.get(d.toLowerCase());
      const uiStatus = summarizeToUiStatus(r?.summary, r?.status);
      const tld = `.${d.split(".").pop() ?? ""}`;
      const priceUsd = uiStatus === "available" ? DEFAULT_PRICES_USD[tld] ?? null : null;
      return {
        domain: d,
        status: uiStatus,
        price_usd: priceUsd,
        currency: priceUsd ? "USD" : null,
        raw: r ? { summary: r.summary ?? null, status: r.status ?? null } : null,
      };
    });

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = (e as any)?.status && Number.isFinite((e as any).status) ? Number((e as any).status) : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
