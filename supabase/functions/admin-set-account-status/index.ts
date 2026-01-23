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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return json(401, { error: "Unauthorized" });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: requester, error: requesterErr } = await admin.auth.getUser(token);
    if (requesterErr || !requester?.user) return json(401, { error: "Unauthorized" });

    const { data: roleRows, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.user.id);
    if (roleErr) throw roleErr;

    const roles = (roleRows ?? []).map((r: any) => String(r.role));
    const isAllowed = roles.includes("admin") || roles.includes("super_admin");
    if (!isAllowed) return json(403, { error: "Forbidden" });

    const body = (await req.json()) as Payload;
    const userId = String(body?.user_id ?? "").trim();
    const nextStatus = normalizeStatus(body?.account_status);

    if (!userId) return json(400, { error: "user_id is required" });
    if (!nextStatus) return json(400, { error: "account_status is invalid" });

    const { error } = await admin.from("profiles").update({ account_status: nextStatus }).eq("id", userId);
    if (error) throw error;

    return json(200, { ok: true, user_id: userId, account_status: nextStatus });
  } catch (e) {
    console.error("admin-set-account-status error:", e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
