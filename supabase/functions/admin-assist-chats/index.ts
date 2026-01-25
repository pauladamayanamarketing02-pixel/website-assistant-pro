// Supabase Edge Function: admin-assist-chats
// Admin-only split-view monitor for Assist <-> User chats.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ListPayload = {
  action: "list";
  limitMessages?: number;
};

type ThreadPayload = {
  action: "thread";
  assistId: string;
  userId: string;
  limit?: number;
};

type Payload = ListPayload | ThreadPayload;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function dedupe<T>(arr: T[]) {
  return Array.from(new Set(arr));
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
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) return json(403, { error: "Forbidden" });

    const body = (await req.json()) as Payload;

    if (body.action === "list") {
      const limitMessages = Math.min(Math.max(Number(body.limitMessages ?? 2500), 200), 5000);

      const { data: assistRoleRows, error: assistRoleErr } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "assist");
      if (assistRoleErr) throw assistRoleErr;
      const assistIds = (assistRoleRows ?? []).map((r: any) => String(r.user_id));
      const assistSet = new Set(assistIds);

      const { data: userRoleRows, error: userRoleErr } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");
      if (userRoleErr) throw userRoleErr;
      const userIds = (userRoleRows ?? []).map((r: any) => String(r.user_id));
      const userSet = new Set(userIds);

      // Pull latest messages across all assist<->user pairs and aggregate into threads.
      // This keeps the edge function simple (no SQL views) and avoids RLS issues.
      const { data: rows, error: msgErr } = await admin
        .from("messages")
        .select("id,sender_id,receiver_id,content,created_at")
        .order("created_at", { ascending: false })
        .limit(limitMessages);
      if (msgErr) throw msgErr;

      type Thread = {
        threadId: string; // `${assistId}:${userId}`
        assistId: string;
        userId: string;
        lastMessageAt: string;
        lastMessagePreview: string;
        assistName: string;
        assistAvatarUrl: string | null;
        userName: string;
        userBusinessName: string | null;
      };

      const threads = new Map<string, Thread>();
      const participantIds: string[] = [];
      const threadUserIds: string[] = [];

      for (const m of rows ?? []) {
        const senderId = String((m as any).sender_id);
        const receiverId = String((m as any).receiver_id);
        const senderIsAssist = assistSet.has(senderId);
        const receiverIsAssist = assistSet.has(receiverId);

        // Only assist <-> user
        if (senderIsAssist && userSet.has(receiverId)) {
          const assistId = senderId;
          const userId = receiverId;
          const key = `${assistId}:${userId}`;
          if (!threads.has(key)) {
            threads.set(key, {
              threadId: key,
              assistId,
              userId,
              lastMessageAt: String((m as any).created_at),
              lastMessagePreview: String((m as any).content ?? "").slice(0, 120),
              assistName: "",
              assistAvatarUrl: null,
              userName: "",
              userBusinessName: null,
            });
            participantIds.push(assistId, userId);
            threadUserIds.push(userId);
          }
          continue;
        }

        if (receiverIsAssist && userSet.has(senderId)) {
          const assistId = receiverId;
          const userId = senderId;
          const key = `${assistId}:${userId}`;
          if (!threads.has(key)) {
            threads.set(key, {
              threadId: key,
              assistId,
              userId,
              lastMessageAt: String((m as any).created_at),
              lastMessagePreview: String((m as any).content ?? "").slice(0, 120),
              assistName: "",
              assistAvatarUrl: null,
              userName: "",
              userBusinessName: null,
            });
            participantIds.push(assistId, userId);
            threadUserIds.push(userId);
          }
        }
      }

      const uniqueParticipantIds = dedupe(participantIds);
      const uniqueUserIds = dedupe(threadUserIds);

      const { data: profiles, error: profErr } = await admin
        .from("profiles")
        .select("id,name,avatar_url,business_name")
        .in("id", uniqueParticipantIds);
      if (profErr) throw profErr;
      const profilesById = new Map<string, any>((profiles ?? []).map((p: any) => [String(p.id), p]));

      const { data: businesses, error: bizErr } = await admin
        .from("businesses")
        .select("user_id,business_name")
        .in("user_id", uniqueUserIds);
      if (bizErr) throw bizErr;
      const businessByUserId = new Map<string, any>((businesses ?? []).map((b: any) => [String(b.user_id), b]));

      const out: Thread[] = [];
      for (const t of threads.values()) {
        const assist = profilesById.get(t.assistId);
        const user = profilesById.get(t.userId);
        const biz = businessByUserId.get(t.userId);

        out.push({
          ...t,
          assistName: String(assist?.name ?? "Assist"),
          assistAvatarUrl: (assist?.avatar_url ?? null) as string | null,
          userName: String(user?.name ?? "User"),
          userBusinessName: (biz?.business_name ?? user?.business_name ?? null) as string | null,
        });
      }

      out.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
      return json(200, { threads: out });
    }

    if (body.action === "thread") {
      const assistId = String((body as any).assistId ?? "").trim();
      const userId = String((body as any).userId ?? "").trim();
      const limit = Math.min(Math.max(Number((body as any).limit ?? 200), 50), 500);
      if (!assistId || !userId) return json(400, { error: "assistId and userId are required" });

      const { data: msgs, error: msgErr } = await admin
        .from("messages")
        .select("id,sender_id,receiver_id,content,file_url,is_read,created_at")
        .or(
          `and(sender_id.eq.${assistId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${assistId})`
        )
        .order("created_at", { ascending: true })
        .limit(limit);
      if (msgErr) throw msgErr;

      const { data: profiles, error: profErr } = await admin
        .from("profiles")
        .select("id,name,avatar_url")
        .in("id", [assistId, userId]);
      if (profErr) throw profErr;

      const byId = new Map<string, any>((profiles ?? []).map((p: any) => [String(p.id), p]));

      return json(200, {
        participants: {
          assist: {
            id: assistId,
            name: String(byId.get(assistId)?.name ?? "Assist"),
            avatar_url: (byId.get(assistId)?.avatar_url ?? null) as string | null,
          },
          user: {
            id: userId,
            name: String(byId.get(userId)?.name ?? "User"),
            avatar_url: (byId.get(userId)?.avatar_url ?? null) as string | null,
          },
        },
        messages: msgs ?? [],
      });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    console.error("admin-assist-chats error", e);
    return json(500, { error: getErrorMessage(e) });
  }
});
