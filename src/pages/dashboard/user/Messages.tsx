import { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, MessageCircle, User, Search, Trash2, Upload, Download, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface AssistContact {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  specialization: string | null;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [assists, setAssists] = useState<AssistContact[]>([]);
  const [selectedAssist, setSelectedAssist] = useState<AssistContact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assists
  useEffect(() => {
    const fetchAssists = async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'assist');

      if (roles) {
        const assistIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url, specialization')
          .in('id', assistIds);

        if (profiles) {
          setAssists(profiles as AssistContact[]);
          if (profiles.length > 0) {
            setSelectedAssist(profiles[0] as AssistContact);
          }
        }
      }
      setLoading(false);
    };

    fetchAssists();
  }, []);

  // Fetch messages for selected assist
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !selectedAssist) return;

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedAssist.id}),and(sender_id.eq.${selectedAssist.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', selectedAssist.id)
          .eq('is_read', false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    if (!user || !selectedAssist) return;
    
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedAssist?.id) ||
            (newMsg.sender_id === selectedAssist?.id && newMsg.receiver_id === user?.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedAssist]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!user || !selectedAssist || (!newMessage.trim() && !uploadedFile)) return;

    setSending(true);
    setUploading(true);

    try {
      let fileUrl: string | null = null;

      // Upload file if exists
      if (uploadedFile) {
        const filePath = `messages/${user.id}/${Date.now()}-${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, uploadedFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('user-files')
            .getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedAssist.id,
        content: newMessage.trim() || (uploadedFile ? `📎 ${uploadedFile.name}` : ''),
        file_url: fileUrl,
      });

      if (error) throw error;
      setNewMessage('');
      setUploadedFile(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error sending message',
        description: error.message,
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleClearChat = async () => {
    if (!user || !selectedAssist) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedAssist.id}),and(sender_id.eq.${selectedAssist.id},receiver_id.eq.${user.id})`);

      if (error) throw error;

      setMessages([]);
      toast({
        title: 'Chat cleared',
        description: 'All messages have been deleted.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/^\d+-/, '');
  };

  const filteredAssists = assists.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Chat with your Marketing Assist</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Contacts List */}
        <Card className="md:col-span-1">
          <CardHeader className="border-b py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredAssists.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No assists available</p>
                </div>
              ) : (
                filteredAssists.map((assist) => (
                  <div
                    key={assist.id}
                    onClick={() => setSelectedAssist(assist)}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                      selectedAssist?.id === assist.id && "bg-muted"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assist.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {assist.name?.charAt(0)?.toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{assist.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {assist.specialization || assist.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedAssist ? (
            <>
              <CardHeader className="border-b py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedAssist.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedAssist.name?.charAt(0)?.toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedAssist.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {selectedAssist.specialization || 'Marketing Assist'}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete all messages with {selectedAssist.name}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-destructive-foreground">
                          Clear Chat
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-foreground">No messages yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a conversation with {selectedAssist.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            message.sender_id === user?.id ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-4 py-2",
                              message.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.file_url && (
                              <a
                                href={message.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className={cn(
                                  "flex items-center gap-1 text-xs mt-2 underline",
                                  message.sender_id === user?.id
                                    ? "text-primary-foreground/80"
                                    : "text-primary"
                                )}
                              >
                                <Download className="h-3 w-3" />
                                {getFileName(message.file_url)}
                              </a>
                            )}
                            <p
                              className={cn(
                                "text-xs mt-1",
                                message.sender_id === user?.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t space-y-2">
                  {uploadedFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                      <Paperclip className="h-4 w-4" />
                      <span className="flex-1 truncate">{uploadedFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUploadedFile(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[44px] max-h-32 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={(!newMessage.trim() && !uploadedFile) || sending}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground">Select an assist</h3>
                <p className="text-sm text-muted-foreground">
                  Choose an assist from the list to start chatting
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}