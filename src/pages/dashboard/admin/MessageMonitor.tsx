import { useEffect, useMemo, useState } from "react";
import { Search, MessageSquare } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssistRow = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  status?: string;
};

type PeerRow = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  business_name: string | null;
  last_message_at: string | null;
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

function initials(name: string) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function AdminMessageMonitor() {
  const [loadingAssists, setLoadingAssists] = useState(true);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const [assists, setAssists] = useState<AssistRow[]>([]);
  const [selectedAssist, setSelectedAssist] = useState<AssistRow | null>(null);
  const [assistQuery, setAssistQuery] = useState("");

  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<PeerRow | null>(null);
  const [peerQuery, setPeerQuery] = useState("");

  const [messages, setMessages] = useState<MessageRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAssists(true);
      const { data, error } = await supabase.functions.invoke("admin-message-monitor", {
        body: { action: "list_assists" },
      });

      if (!mounted) return;
      if (error || data?.error) {
        console.error("Failed to load assists", error ?? data?.error);
        setAssists([]);
        setSelectedAssist(null);
      } else {
        const normalized = ((data?.assists ?? []) as any[]).map((a) => ({
          id: String(a.id),
          name: String(a.name ?? ""),
          email: String(a.email ?? ""),
          avatar_url: (a.avatar_url ?? null) as string | null,
          status: String(a.status ?? "active"),
        })) as AssistRow[];
        setAssists(normalized);
        setSelectedAssist(normalized[0] ?? null);
      }
      setLoadingAssists(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedAssist?.id) {
        setPeers([]);
        setSelectedPeer(null);
        return;
      }

      setLoadingPeers(true);
      setPeers([]);
      setSelectedPeer(null);
      setMessages([]);

      const { data, error } = await supabase.functions.invoke("admin-message-monitor", {
        body: { action: "list_peers", assistId: selectedAssist.id },
      });

      if (!mounted) return;
      if (error || data?.error) {
        console.error("Failed to load assist conversations", error ?? data?.error);
        setPeers([]);
        setSelectedPeer(null);
      } else {
        const rows = ((data?.peers ?? []) as any[]).map((p) => ({
          id: String(p.id),
          name: String(p.name ?? ""),
          email: String(p.email ?? ""),
          avatar_url: (p.avatar_url ?? null) as string | null,
          business_name: (p.business_name ?? null) as string | null,
          last_message_at: (p.last_message_at ?? null) as string | null,
        })) as PeerRow[];
        setPeers(rows);
        setSelectedPeer(rows[0] ?? null);
      }
      setLoadingPeers(false);
    })();

    return () => {
      mounted = false;
    };
  }, [selectedAssist?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedAssist?.id || !selectedPeer?.id) {
        setMessages([]);
        return;
      }
      setLoadingThread(true);
      const { data, error } = await supabase.functions.invoke("admin-message-monitor", {
        body: {
          action: "fetch_thread",
          assistId: selectedAssist.id,
          peerId: selectedPeer.id,
          limit: 500,
        },
      });

      if (!mounted) return;
      if (error || data?.error) {
        console.error("Failed to load thread", error ?? data?.error);
        setMessages([]);
      } else {
        const rows = ((data?.messages ?? []) as any[]).map((m) => ({
          id: String(m.id),
          sender_id: String(m.sender_id),
          receiver_id: String(m.receiver_id),
          content: String(m.content ?? ""),
          file_url: (m.file_url ?? null) as string | null,
          is_read: (m.is_read ?? null) as boolean | null,
          created_at: String(m.created_at),
        })) as MessageRow[];
        setMessages(rows);
      }
      setLoadingThread(false);
    })();

    return () => {
      mounted = false;
    };
  }, [selectedAssist?.id, selectedPeer?.id]);

  const filteredAssists = useMemo(() => {
    const q = assistQuery.trim().toLowerCase();
    if (!q) return assists;
    return assists.filter((a) => (a.name ?? "").toLowerCase().includes(q) || (a.email ?? "").toLowerCase().includes(q));
  }, [assists, assistQuery]);

  const filteredPeers = useMemo(() => {
    const q = peerQuery.trim().toLowerCase();
    if (!q) return peers;
    return peers.filter((p) => {
      return (
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.business_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [peers, peerQuery]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Message Monitor</h1>
        <p className="text-sm text-muted-foreground">
          View Assist conversations. Pick an Assist, then select a conversation to see the full thread.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Assists */}
        <Card className="lg:col-span-3">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Assists</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={assistQuery} onChange={(e) => setAssistQuery(e.target.value)} placeholder="Search assists..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingAssists ? (
              <div className="py-6 text-sm text-muted-foreground">Loading assists...</div>
            ) : filteredAssists.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">No assists found.</div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-1 pr-3">
                  {filteredAssists.map((a) => {
                    const active = selectedAssist?.id === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAssist(a)}
                        className={cn(
                          "w-full text-left rounded-md border border-transparent p-2 hover:bg-accent/50",
                          active ? "bg-accent text-accent-foreground" : "text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={a.avatar_url ?? undefined} alt={a.name} />
                            <AvatarFallback>{initials(a.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{a.name || "(Unnamed)"}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.email}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card className="lg:col-span-4">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={peerQuery} onChange={(e) => setPeerQuery(e.target.value)} placeholder="Search conversations..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent>
            {!selectedAssist ? (
              <div className="py-6 text-sm text-muted-foreground">Select an assist to view conversations.</div>
            ) : loadingPeers ? (
              <div className="py-6 text-sm text-muted-foreground">Loading conversations...</div>
            ) : filteredPeers.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">No conversations found.</div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-1 pr-3">
                  {filteredPeers.map((p) => {
                    const active = selectedPeer?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPeer(p)}
                        className={cn(
                          "w-full text-left rounded-md border border-transparent p-2 hover:bg-accent/50",
                          active ? "bg-accent text-accent-foreground" : "text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.avatar_url ?? undefined} alt={p.name} />
                            <AvatarFallback>{initials(p.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{p.name || "(Unnamed)"}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p.business_name ? `${p.business_name} • ` : ""}
                              {p.email}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Thread</CardTitle>
              <div className="text-xs text-muted-foreground truncate">
                {selectedAssist?.name ? `${selectedAssist.name}` : ""}
                {selectedPeer?.name ? ` → ${selectedPeer.name}` : ""}
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              <MessageSquare className="h-4 w-4 mr-2" /> Read-only
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedAssist || !selectedPeer ? (
              <div className="py-6 text-sm text-muted-foreground">Select a conversation to view messages.</div>
            ) : loadingThread ? (
              <div className="py-6 text-sm text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">No messages in this thread.</div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-3 pr-3">
                  {messages.map((m) => {
                    const fromAssist = m.sender_id === selectedAssist.id;
                    return (
                      <div key={m.id} className={cn("flex", fromAssist ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg border border-border bg-card p-3",
                            fromAssist ? "" : "bg-accent/40"
                          )}
                        >
                          <div className="text-xs text-muted-foreground">
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                          {m.content ? <div className="mt-1 text-sm whitespace-pre-wrap break-words">{m.content}</div> : null}
                          {m.file_url ? (
                            <div className="mt-2">
                              <a
                                className="text-sm underline underline-offset-4"
                                href={m.file_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Attachment
                              </a>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
