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

type UserContact = {
  id: string;
  name: string;
  email: string;
  business_name: string | null;
};

export default function AssistMessages() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserContact[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
  const [lastPreviewByContact, setLastPreviewByContact] = useState<Record<string, string | null>>({});

  const scrollBottomRef = useRef<HTMLDivElement>(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  // Contacts: all business users (role user) + business name
  useEffect(() => {
    const run = async () => {
      const { data: roles } = await (supabase as any).from("user_roles").select("user_id").eq("role", "user");
      const userIds = ((roles as any[]) ?? []).map((r) => r.user_id);

      if (userIds.length) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("id, name, email, business_name")
          .in("id", userIds);

        const { data: businesses } = await (supabase as any)
          .from("businesses")
          .select("user_id, business_name")
          .in("user_id", userIds);

        const next = ((profiles as any[]) ?? []).map((p) => {
          const b = ((businesses as any[]) ?? []).find((x) => x.user_id === p.id);
          return {
            ...p,
            business_name: b?.business_name || p.business_name || null,
          } as UserContact;
        });

        setUsers(next);
        setSelectedUserId((prev) => prev ?? next[0]?.id ?? null);
      } else {
        setUsers([]);
        setSelectedUserId(null);
      }

      setLoading(false);
    };

    void run();
  }, []);

  // Unread + last preview summary
  useEffect(() => {
    const run = async () => {
      if (!user) return;

      const { data: rows } = await (supabase as any)
        .from("messages")
        .select("sender_id, receiver_id, content, is_read, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(300);

      const unread: Record<string, number> = {};
      const preview: Record<string, string | null> = {};

      for (const m of (rows ?? []) as any[]) {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (preview[otherId] === undefined) preview[otherId] = toPreviewText(m.content);
        if (m.receiver_id === user.id && m.is_read === false) unread[otherId] = (unread[otherId] ?? 0) + 1;
      }

      setUnreadByContact(unread);
      setLastPreviewByContact(preview);
    };

    void run();
  }, [user]);

  // Thread messages for selected user
  useEffect(() => {
    const fetchThread = async () => {
      if (!user || !selectedUserId) return;

      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      setMessages(((data as any[]) ?? []) as ChatMessage[]);

      await (supabase as any)
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", selectedUserId)
        .eq("is_read", false);

      setUnreadByContact((prev) => ({ ...prev, [selectedUserId]: 0 }));
    };

    void fetchThread();

    if (!user || !selectedUserId) return;

    const channel = supabase
      .channel(`assist-thread-${user.id}-${selectedUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          const inThisThread =
            (msg.sender_id === user.id && msg.receiver_id === selectedUserId) ||
            (msg.sender_id === selectedUserId && msg.receiver_id === user.id);
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
  }, [user, selectedUserId]);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!user || !selectedUserId) return;
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

      const { error } = await (supabase as any).from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedUserId,
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
    if (!user || !selectedUserId) return;

    try {
      const { error } = await (supabase as any)
        .from("messages")
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`);
      if (error) throw error;

      setMessages([]);
      toast({ title: "Chat dihapus", description: "Semua pesan pada percakapan ini telah dihapus." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e?.message ?? String(e) });
    }
  };

  const contactsUi = useMemo<ChatContactUI[]>(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = users
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.business_name ?? "").toLowerCase().includes(q)
        );
      })
      .map((u) => ({
        id: u.id,
        // per permintaan: Assist melihat Business Name sebagai label kontak utama
        title: u.business_name || u.name,
        subtitle: u.business_name ? u.name : u.email,
        unreadCount: unreadByContact[u.id] ?? 0,
        lastPreview: lastPreviewByContact[u.id] ?? null,
      }));

    return list.sort((x, y) => {
      const ud = (y.unreadCount ?? 0) - (x.unreadCount ?? 0);
      if (ud !== 0) return ud;
      return x.title.localeCompare(y.title);
    });
  }, [users, searchQuery, unreadByContact, lastPreviewByContact]);

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
      pageSubtitle="Chat dengan klien Anda"
      searchPlaceholder="Cari bisnis / nama…"
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      contacts={contactsUi}
      selectedContactId={selectedUserId}
      onSelectContact={(id) => setSelectedUserId(id)}
      leftEmptyState={
        <div className="text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Belum ada klien</p>
        </div>
      }
      rightEmptyState={
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-foreground">Pilih klien</h3>
          <p className="text-sm text-muted-foreground">Pilih dari daftar kontak untuk mulai chat</p>
        </div>
      }
      rightPanel={
        <>
          <CardHeader className="border-b py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{selectedUser?.business_name || selectedUser?.name || "—"}</CardTitle>
                <p className="text-xs text-muted-foreground">{selectedUser?.business_name ? selectedUser?.name : selectedUser?.email}</p>
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
                      Ini akan menghapus semua pesan dengan {selectedUser?.business_name || selectedUser?.name}. Aksi ini tidak bisa dibatalkan.
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
                    <MessageBubble key={m.id} message={m} isOwn={m.sender_id === user?.id} bubbleVariant="soft" />
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
