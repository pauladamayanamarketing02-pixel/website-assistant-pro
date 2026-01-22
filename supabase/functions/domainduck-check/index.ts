const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CheckRequest = {
  domain: string;
};

type DomainDuckAvailability = "true" | "false" | "premium" | "blocked";

function normalizeDomain(raw: string): string {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "";
  return v.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function coerceAvailability(input: unknown): DomainDuckAvailability {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "true" || v === "false" || v === "premium" || v === "blocked") return v;
  return "blocked";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("DOMAINDUCK_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing DOMAINDUCK_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as CheckRequest | null;
    const domain = normalizeDomain(body?.domain ?? "");
    if (!domain) {
      return new Response(JSON.stringify({ error: "domain is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://v1.api.domainduck.io/api/get/");
    url.searchParams.set("domain", domain);
    url.searchParams.set("apikey", apiKey);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const text = await resp.text();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({
          error: `DomainDuck error (${resp.status})`,
          details: text,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const json = JSON.parse(text) as Record<string, unknown>;
    const availability = coerceAvailability(json?.availability);

    return new Response(JSON.stringify({ availability }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
