// Supabase Edge Function: admin-set-account-status
// Admin-only action to update profiles.account_status for a user.
// Intended for managing Business User onboarding states (pending/approved/active/etc.).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AllowedStatus = "pending" | "approved" | "active" | "suspended" | "expired";

type Payload = {
  user_id: string;
  account_status: AllowedStatus;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const m = Number(months || 0);
  if (!Number.isFinite(m) || m <= 0) return d;
  d.setMonth(d.getMonth() + m);
  return d;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeStatus(v: unknown): AllowedStatus | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "pending") return "pending";
  if (s === "approved") return "approved";
  if (s === "active") return "active";
  if (s === "suspended") return "suspended";
  if (s === "expired") return "expired";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    console.log("[admin-set-account-status] Request received");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[admin-set-account-status] Missing environment variables");
      return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    console.log("[admin-set-account-status] Auth header present:", !!authHeader);
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.error("[admin-set-account-status] No token found in Authorization header");
      return json(401, { error: "Unauthorized - No token provided" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: requester, error: requesterErr } = await admin.auth.getUser(token);
    if (requesterErr || !requester?.user) {
      console.error("[admin-set-account-status] Token validation failed:", requesterErr?.message);
      return json(401, { error: "Unauthorized - Invalid token" });
    }
    
    console.log("[admin-set-account-status] User authenticated:", requester.user.id);

    const { data: roleRows, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.user.id);
    if (roleErr) {
      console.error("[admin-set-account-status] Role query failed:", roleErr.message);
      throw roleErr;
    }

    const roles = (roleRows ?? []).map((r: any) => String(r.role));
    console.log("[admin-set-account-status] User roles:", roles);
    const isAllowed = roles.includes("admin") || roles.includes("super_admin");
    if (!isAllowed) {
      console.error("[admin-set-account-status] User lacks required role");
      return json(403, { error: "Forbidden - Admin role required" });
    }

    const body = (await req.json()) as Payload;
    const userId = String(body?.user_id ?? "").trim();
    const nextStatus = normalizeStatus(body?.account_status);

    if (!userId) return json(400, { error: "user_id is required" });
    if (!nextStatus) return json(400, { error: "account_status is invalid" });

    const { error } = await admin.from("profiles").update({ account_status: nextStatus }).eq("id", userId);
    if (error) throw error;

    // Keep user_packages workflow in sync with account_status so the user dashboard can show:
    // pending -> Awaiting Approval
    // approved -> Awaiting Payment
    // active -> Active since + Expires on
    if (nextStatus === "approved" || nextStatus === "active") {
      const { data: latestPkg, error: pkgErr } = await admin
        .from("user_packages")
        .select("id,status,duration_months")
        .eq("user_id", userId)
        .in("status", ["pending", "approved", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pkgErr) throw pkgErr;

      if (latestPkg?.id) {
        const currentStatus = String((latestPkg as any).status ?? "").toLowerCase().trim();

        if (nextStatus === "approved") {
          // Move pending -> approved (do not touch dates)
          if (currentStatus === "pending") {
            const { error: upErr } = await admin
              .from("user_packages")
              .update({ status: "approved" })
              .eq("id", (latestPkg as any).id);
            if (upErr) throw upErr;
          }
        }

        if (nextStatus === "active") {
          // Activate latest request (pending/approved) and set dates
          if (currentStatus !== "active") {
            const startedAt = new Date();
            const months = Number((latestPkg as any).duration_months ?? 1);
            const expiresAt = addMonths(startedAt, months);
            const { error: upErr } = await admin
              .from("user_packages")
              .update({
                status: "active",
                started_at: startedAt.toISOString(),
                expires_at: expiresAt.toISOString(),
              })
              .eq("id", (latestPkg as any).id);
            if (upErr) throw upErr;
          }
        }
      }
    }

    return json(200, { ok: true, user_id: userId, account_status: nextStatus });
  } catch (e) {
    console.error("admin-set-account-status error:", e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
