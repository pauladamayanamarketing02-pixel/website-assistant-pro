// Supabase Edge Function: admin-account-actions
// Admin-only actions for managing business users:
// - reset_password: send password reset email via Supabase Auth
// - change_email: change user's email (requires confirmation to new email)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload =
  | {
      action: "reset_password";
      email: string;
    }
  | {
      action: "change_email";
      user_id: string;
      new_email: string;
    };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    // Authorize requester: admin only
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.user.id)
      .maybeSingle();

    if (roleErr) throw roleErr;
    if (roleRow?.role !== "admin") return json(403, { error: "Forbidden" });

    const body = (await req.json()) as Payload;

    if (body.action === "reset_password") {
      const email = String(body.email ?? "").trim();
      if (!email) return json(400, { error: "email is required" });

      const origin = req.headers.get("origin") ?? "";
      const redirectTo = origin ? `${origin}/auth/reset-password` : undefined;

      const { error } = await admin.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
      if (error) throw error;

      return json(200, { ok: true });
    }

    if (body.action === "change_email") {
      const userId = String(body.user_id ?? "").trim();
      const newEmail = String(body.new_email ?? "").trim();
      if (!userId) return json(400, { error: "user_id is required" });
      if (!newEmail) return json(400, { error: "new_email is required" });

      const { data, error } = await admin.auth.admin.updateUserById(userId, {
        email: newEmail,
      });
      if (error) throw error;

      return json(200, { ok: true, user_id: data.user?.id, email: data.user?.email });
    }

    return json(400, { error: "Invalid action" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json(500, { error: message });
  }
});
