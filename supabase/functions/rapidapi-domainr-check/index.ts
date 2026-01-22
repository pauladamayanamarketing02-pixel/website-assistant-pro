// Supabase Edge Function: rapidapi-domainr-check
// Domain availability via Domainr (RapidAPI).

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
  if (s.includes("premium")) return "premium" as const;
  if (s.includes("inactive") || s.includes("undelegated")) return "available" as const;
  if (s.includes("active") || s.includes("delegated")) return "unavailable" as const;
  return "unknown" as const;
}

const POPULAR_TLDS = [".com", ".net", ".co", ".id", ".org"];
const DEFAULT_PRICES_USD: Record<string, number> = {
  ".com": 14.99,
  ".net": 16.99,
  ".co": 32.99,
  ".id": 19.99,
  ".org": 12.99,
};

async function domainrStatusRapidApi(domains: string[], apiKey: string) {
  const qs = encodeURIComponent(domains.join(","));
  const url = `https://domainr.p.rapidapi.com/v2/status?domain=${qs}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "domainr.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`Domainr (RapidAPI) error (${res.status}): ${txt || res.statusText}`);
    (err as any).status = res.status;
    throw err;
  }

  const json = (await res.json()) as { status?: DomainrStatusRow[] };
  return json.status ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Keep these checks consistent with other functions.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("RAPIDAPI_DOMAINR_KEY") ?? "";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing RAPIDAPI_DOMAINR_KEY" }), {
        status: 400,
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

    // (Optional) instantiate admin for future enhancements; not used for now.
    createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const candidates = buildCandidates(query, POPULAR_TLDS);
    const statusRows = await domainrStatusRapidApi(candidates, apiKey);
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
