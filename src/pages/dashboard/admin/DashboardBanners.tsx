import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ThreadRow = {
  threadId: string;
  assistId: string;
  userId: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  assistName: string;
  assistAvatarUrl: string | null;
  userName: string;
  userBusinessName: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  is_read: boolean | null;
  created_at: string;
};

function formatTime(ts: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

export default function AdminDashboardBanners() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selected, setSelected] = useState<ThreadRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [query, setQuery] = useState("");

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const hay = [t.assistName, t.userName, t.userBusinessName ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, threads]);

  const fetchThreads = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-assist-chats", {
        body: { action: "list", limitMessages: 2500 },
      });
      if (error) throw error;
      const next = ((data as any)?.threads ?? []) as ThreadRow[];
      setThreads(next);
      setSelected((prev) => {
        if (prev && next.some((t) => t.threadId === prev.threadId)) {
          return next.find((t) => t.threadId === prev.threadId) ?? prev;
        }
        return next[0] ?? null;
      });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchThread = useCallback(async (t: ThreadRow | null) => {
    setMessages([]);
    if (!t) return;

    setLoadingThread(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-assist-chats", {
        body: { action: "thread", assistId: t.assistId, userId: t.userId, limit: 250 },
      });
      if (error) throw error;
      setMessages(((data as any)?.messages ?? []) as MessageRow[]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    void fetchThread(selected);
  }, [fetchThread, selected]);

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Assist Chat Monitor</h1>
        <p className="text-muted-foreground">
          Split view untuk melihat chat Assist ↔ User (read-only, sorted by last activity).
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        {/* Left: thread list */}
        <Card className="min-h-[560px]">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Threads</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fetchThreads()}
                disabled={loadingList}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari assist / user / business…"
            />
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="p-2">
                {loadingList ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Tidak ada chat.</div>
                ) : (
                  <div className="space-y-1">
                    {filteredThreads.map((t) => {
                      const active = selected?.threadId === t.threadId;
                      return (
                        <button
                          key={t.threadId}
                          type="button"
                          onClick={() => setSelected(t)}
                          className={cn(
                            "w-full text-left rounded-lg border border-border bg-card px-3 py-3 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring",
                            active && "bg-muted/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 mt-0.5">
                              <AvatarImage src={t.assistAvatarUrl ?? undefined} />
                              <AvatarFallback>
                                {(t.assistName?.[0] ?? "A").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-foreground truncate">
                                    {t.assistName} → {t.userBusinessName ?? t.userName}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">{t.userName}</div>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTime(t.lastMessageAt)}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                {t.lastMessagePreview || "(no content)"}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: messages */}
        <Card className="min-h-[560px]">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">
                {selected ? `${selected.assistName} ↔ ${selected.userBusinessName ?? selected.userName}` : "Select a thread"}
              </CardTitle>
              <div className="text-xs text-muted-foreground truncate">
                {selected ? `Assist: ${selected.assistName} • User: ${selected.userName}` : ""}
              </div>
            </div>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-3">
                {!selected ? (
                  <div className="text-sm text-muted-foreground">Pilih thread di kiri.</div>
                ) : loadingThread ? (
                  <div className="text-sm text-muted-foreground">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada pesan.</div>
                ) : (
                  messages.map((m) => {
                    const fromAssist = m.sender_id === selected.assistId;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", fromAssist ? "justify-start" : "justify-end")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl border border-border px-3 py-2",
                            fromAssist ? "bg-muted/50" : "bg-primary/10"
                          )}
                        >
                          <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {m.content}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground text-right">
                            {formatTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
