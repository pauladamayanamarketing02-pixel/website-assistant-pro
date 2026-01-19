import { Download, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileNameFromUrl, formatMessageTime } from "@/components/messages/chatUtils";

export type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  created_at: string;
};

type Props = {
  message: ChatMessage;
  isOwn: boolean;
  bubbleVariant?: "soft" | "solid";
};

export function MessageBubble({ message, isOwn, bubbleVariant = "soft" }: Props) {
  const time = formatMessageTime(message.created_at);

  const ownClass =
    bubbleVariant === "solid"
      ? "bg-primary text-primary-foreground"
      : "bg-primary/10 text-foreground";

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2 shadow-sm",
          isOwn ? "rounded-br-sm" : "rounded-bl-sm",
          isOwn ? ownClass : "bg-muted text-foreground"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {message.file_url ? (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
              isOwn ? "border-primary/20 bg-background/40" : "border-muted-foreground/10 bg-background/60"
            )}
          >
            <Paperclip className="h-4 w-4" />
            <span className="truncate flex-1">{fileNameFromUrl(message.file_url)}</span>
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Download className="h-3 w-3" />
              Download
            </a>
          </div>
        ) : null}

        <div className={cn("mt-1 text-[10px] opacity-70", isOwn ? "text-right" : "text-left")}>
          {time}
        </div>
      </div>
    </div>
  );
}
