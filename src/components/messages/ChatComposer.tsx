import { useRef } from "react";
import { Send, Upload, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (v: string) => void;

  uploadedFile: File | null;
  onPickFile: (file: File | null) => void;

  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
};

export function ChatComposer({
  value,
  onChange,
  uploadedFile,
  onPickFile,
  onSend,
  disabled,
  sending,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-t p-3 space-y-2 bg-background/60 backdrop-blur">
      {uploadedFile ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/60 rounded-md px-3 py-2">
          <span className="flex items-center gap-2 min-w-0">
            <Paperclip className="h-3 w-3" />
            <span className="truncate">{uploadedFile.name}</span>
          </span>
          <button
            type="button"
            onClick={() => onPickFile(null)}
            className="inline-flex items-center justify-center rounded-full hover:bg-muted p-1"
            aria-label="Remove attachment"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onPickFile(f);
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
        >
          <Upload className="h-4 w-4" />
        </Button>

        <Textarea
          placeholder="Ketik pesan…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <Button
          type="button"
          onClick={onSend}
          disabled={disabled || (!value.trim() && !uploadedFile) || Boolean(sending)}
          className="h-10"
        >
          <Send className="h-4 w-4 mr-1" />
          Kirim
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Enter untuk kirim • Shift+Enter untuk baris baru</span>
      </div>
    </div>
  );
}
