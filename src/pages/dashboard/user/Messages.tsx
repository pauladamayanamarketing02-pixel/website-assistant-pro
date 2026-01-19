import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Trash2, User } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChatPageShell, type ChatContactUI } from "@/components/messages/ChatPageShell";
import { ChatComposer } from "@/components/messages/ChatComposer";
import { MessageBubble, type ChatMessage } from "@/components/messages/MessageBubble";
import { toPreviewText } from "@/components/messages/chatUtils";

type AssistContact = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [assists, setAssists] = useState<AssistContact[]>([]);
  const [selectedAssistId, setSelectedAssistId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
  const [lastPreviewByContact, setLastPreviewByContact] = useState<Record<string, string | null>>({});

  const scrollBottomRef = useRef<HTMLDivElement>(null);

  const selectedAssist = useMemo(
    () => assists.find((a) => a.id === selectedAssistId) ?? null,
    [assists, selectedAssistId]
  );

  // Contacts: all assists (role assist)
  useEffect(() => {
    const run = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "assist");
      const assistIds = (roles ?? []).map((r) => r.user_id);

      if (assistIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, email, avatar_url")
          .in("id", assistIds);

        const next = (profiles as AssistContact[]) ?? [];
        setAssists(next);
        setSelectedAssistId((prev) => prev ?? next[0]?.id ?? null);
      } else {
        setAssists([]);
        setSelectedAssistId(null);
      }

      setLoading(false);
    };

    void run();
  }, []);

  // Unread + last preview summary (single query)
  useEffect(() => {
    const run = async () => {
      if (!user) return;

      const { data: rows } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, is_read, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(300);

      const unread: Record<string, number> = {};
      const preview: Record<string, string | null> = {};

      for (const m of (rows ?? []) as any[]) {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;

        // last preview (first time we see this contact due to desc order)
        if (preview[otherId] === undefined) preview[otherId] = toPreviewText(m.content);

        // unread count
        if (m.receiver_id === user.id && m.is_read === false) {
          unread[otherId] = (unread[otherId] ?? 0) + 1;
        }
      }

      setUnreadByContact(unread);
      setLastPreviewByContact(preview);
    };

    void run();
  }, [user]);

  // Thread messages for selected assist
  useEffect(() => {
    const fetchThread = async () => {
      if (!user || !selectedAssistId) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedAssistId}),and(sender_id.eq.${selectedAssistId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(((data as any[]) ?? []) as ChatMessage[]);

      // mark read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", selectedAssistId)
        .eq("is_read", false);

      setUnreadByContact((prev) => ({ ...prev, [selectedAssistId]: 0 }));
    };

    void fetchThread();

    if (!user || !selectedAssistId) return;

    const channel = supabase
      .channel(`user-thread-${user.id}-${selectedAssistId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          const inThisThread =
            (msg.sender_id === user.id && msg.receiver_id === selectedAssistId) ||
            (msg.sender_id === selectedAssistId && msg.receiver_id === user.id);

          if (!inThisThread) return;

          setMessages((prev) => [...prev, msg]);

          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          setLastPreviewByContact((prev) => ({ ...prev, [otherId]: toPreviewText(msg.content) }));

          if (msg.receiver_id === user.id) {
            setUnreadByContact((prev) => ({ ...prev, [otherId]: (prev[otherId] ?? 0) + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedAssistId]);

  // auto-scroll
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!user || !selectedAssistId) return;
    if (!newMessage.trim() && !uploadedFile) return;

    setSending(true);

    try {
      let fileUrl: string | null = null;

      if (uploadedFile) {
        const filePath = `messages/${user.id}/${Date.now()}-${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage.from("user-files").upload(filePath, uploadedFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      const content = newMessage.trim() || (uploadedFile ? `📎 ${uploadedFile.name}` : "");

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedAssistId,
        content,
        file_url: fileUrl,
      });
      if (error) throw error;

      setNewMessage("");
      setUploadedFile(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal mengirim pesan", description: e?.message ?? String(e) });
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!user || !selectedAssistId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedAssistId}),and(sender_id.eq.${selectedAssistId},receiver_id.eq.${user.id})`
        );
      if (error) throw error;

      setMessages([]);
      toast({ title: "Chat dihapus", description: "Semua pesan pada percakapan ini telah dihapus." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e?.message ?? String(e) });
    }
  };

  const contactsUi = useMemo<ChatContactUI[]>(() => {
    const list = assists
      .filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      })
      .map((a) => ({
        id: a.id,
        title: a.name, // Full Name (assist)
        subtitle: "Marketing Assist",
        unreadCount: unreadByContact[a.id] ?? 0,
        lastPreview: lastPreviewByContact[a.id] ?? null,
      }));

    // sort: unread desc then title
    return list.sort((x, y) => {
      const ud = (y.unreadCount ?? 0) - (x.unreadCount ?? 0);
      if (ud !== 0) return ud;
      return x.title.localeCompare(y.title);
    });
  }, [assists, searchQuery, unreadByContact, lastPreviewByContact]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-[680px] bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <ChatPageShell
      pageTitle="Messages"
      pageSubtitle="Chat dengan Marketing Assist Anda"
      searchPlaceholder="Cari assist…"
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      contacts={contactsUi}
      selectedContactId={selectedAssistId}
      onSelectContact={(id) => setSelectedAssistId(id)}
      leftEmptyState={
        <div className="text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Belum ada assist</p>
        </div>
      }
      rightEmptyState={
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-foreground">Pilih assist</h3>
          <p className="text-sm text-muted-foreground">Pilih dari daftar kontak untuk mulai chat</p>
        </div>
      }
      rightPanel={
        <>
          <CardHeader className="border-b py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{selectedAssist?.name ?? "—"}</CardTitle>
                <p className="text-xs text-muted-foreground">Marketing Assist</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Clear chat">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus chat</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ini akan menghapus semua pesan dengan {selectedAssist?.name}. Aksi ini tidak bisa dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-destructive-foreground">
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-16">
                    <MessageCircle className="h-10 w-10 mb-2" />
                    <p className="text-sm">Belum ada pesan. Mulai percakapan!</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble key={m.id} message={m} isOwn={m.sender_id === user?.id} bubbleVariant="solid" />
                  ))
                )}
                <div ref={scrollBottomRef} />
              </div>
            </ScrollArea>

            <ChatComposer
              value={newMessage}
              onChange={setNewMessage}
              uploadedFile={uploadedFile}
              onPickFile={setUploadedFile}
              onSend={handleSend}
              disabled={sending}
              sending={sending}
            />
          </CardContent>
        </>
      }
    />
  );
}
