// Supabase Edge Function: super-admin-integration-secrets
// Stores integration credentials in public.integration_secrets.
// - Master key is stored (plaintext) in provider=system, name=INTEGRATIONS_MASTER_KEY
// - Other secrets are encrypted with AES-GCM using a key derived from master key

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload =
  | { action: "list" }
  | { action: "set_master_key"; master_key: string }
  | { action: "rotate_master_key"; old_master_key: string; new_master_key: string }
  | { action: "upsert_secret"; provider: string; name: string; value: string };

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const b64 = {
  encode(bytes: Uint8Array) {
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  },
  decode(str: string) {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  },
};

async function deriveAesKey(masterKey: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(masterKey));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptWithMasterKey(masterKey: string, plaintext: string) {
  const key = await deriveAesKey(masterKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plaintext),
  );
  return {
    ciphertext: b64.encode(new Uint8Array(ciphertext)),
    iv: b64.encode(iv),
  };
}

async function decryptWithMasterKey(masterKey: string, ciphertextB64: string, ivB64: string) {
  const key = await deriveAesKey(masterKey);
  const ciphertext = b64.decode(ciphertextB64);
  const iv = b64.decode(ivB64);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return textDecoder.decode(new Uint8Array(plaintext));
}

// Note: keep types loose in edge functions to avoid Deno typecheck issues across esm.sh generics.
async function requireSuperAdmin(admin: any, token: string) {
  const { data: requester, error: requesterErr } = await admin.auth.getUser(token);
  if (requesterErr || !requester?.user) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", requester.user.id)
    .maybeSingle();
  if (roleErr) {
    return { ok: false as const, status: 500, error: roleErr.message };
  }
  if ((roleRow as any)?.role !== "super_admin") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, userId: requester.user.id };
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

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const authz = await requireSuperAdmin(admin, token);
    if (!authz.ok) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Payload;

    if (body.action === "list") {
      const { data, error } = await admin
        .from("integration_secrets")
        .select("provider,name,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify({
        items: (data ?? []).map((r: any) => ({
          provider: String(r.provider),
          name: String(r.name),
          updated_at: String(r.updated_at),
          is_master_key: String(r.provider) === "system" && String(r.name) === "INTEGRATIONS_MASTER_KEY",
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "set_master_key") {
      const mk = String(body.master_key ?? "").trim();
      if (!mk) {
        return new Response(JSON.stringify({ error: "master_key is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await admin.from("integration_secrets").upsert({
        provider: "system",
        name: "INTEGRATIONS_MASTER_KEY",
        ciphertext: mk,
        iv: "plain",
      }, { onConflict: "provider,name" });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "rotate_master_key") {
      const oldKey = String(body.old_master_key ?? "").trim();
      const newKey = String(body.new_master_key ?? "").trim();
      if (!oldKey || !newKey) {
        return new Response(JSON.stringify({ error: "old_master_key and new_master_key are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch current master key and validate
      const { data: mkRow, error: mkErr } = await admin
        .from("integration_secrets")
        .select("ciphertext")
        .eq("provider", "system")
        .eq("name", "INTEGRATIONS_MASTER_KEY")
        .maybeSingle();
      if (mkErr) throw mkErr;
      const current = String((mkRow as any)?.ciphertext ?? "");
      if (!current) {
        return new Response(JSON.stringify({ error: "Master key belum diset" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (current !== oldKey) {
        return new Response(JSON.stringify({ error: "Old master key salah" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-encrypt all non-system secrets
      const { data: rows, error: rowsErr } = await admin
        .from("integration_secrets")
        .select("id,provider,name,ciphertext,iv")
        .neq("provider", "system");
      if (rowsErr) throw rowsErr;

      for (const r of rows ?? []) {
        const provider = String((r as any).provider);
        const name = String((r as any).name);
        const ciphertext = String((r as any).ciphertext);
        const iv = String((r as any).iv);
        if (!ciphertext || !iv || iv === "plain") continue;

        const plain = await decryptWithMasterKey(oldKey, ciphertext, iv);
        const enc = await encryptWithMasterKey(newKey, plain);
        const { error: updErr } = await admin
          .from("integration_secrets")
          .update({ ciphertext: enc.ciphertext, iv: enc.iv })
          .eq("provider", provider)
          .eq("name", name);
        if (updErr) throw updErr;
      }

      // Update master key last
      const { error: setErr } = await admin.from("integration_secrets").upsert({
        provider: "system",
        name: "INTEGRATIONS_MASTER_KEY",
        ciphertext: newKey,
        iv: "plain",
      }, { onConflict: "provider,name" });
      if (setErr) throw setErr;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "upsert_secret") {
      const provider = String((body as any).provider ?? "").trim();
      const name = String((body as any).name ?? "").trim();
      const value = String((body as any).value ?? "");
      if (!provider || !name || !value) {
        return new Response(JSON.stringify({ error: "provider, name, value are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch master key
      const { data: mkRow, error: mkErr } = await admin
        .from("integration_secrets")
        .select("ciphertext")
        .eq("provider", "system")
        .eq("name", "INTEGRATIONS_MASTER_KEY")
        .maybeSingle();
      if (mkErr) throw mkErr;
      const masterKey = String((mkRow as any)?.ciphertext ?? "");
      if (!masterKey) {
        return new Response(JSON.stringify({ error: "Master key belum diset" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const enc = await encryptWithMasterKey(masterKey, value);

      const { error } = await admin.from("integration_secrets").upsert({
        provider,
        name,
        ciphertext: enc.ciphertext,
        iv: enc.iv,
      }, { onConflict: "provider,name" });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
