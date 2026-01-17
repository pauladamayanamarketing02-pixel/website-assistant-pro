import * as React from "react";

import { Eye, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function makeId(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(16).slice(2)}`;
}

type Props = {
  label?: string;
  accept?: string;
  multiple?: boolean;
  baseName: string;
  items: UploadItem[];
  onChange: (next: UploadItem[]) => void;
};

export default function MultiImageUpload({
  label = "File Upload",
  accept = "image/*",
  multiple = true,
  baseName,
  items,
  onChange,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const latestItemsRef = React.useRef<UploadItem[]>(items);

  const [previewItem, setPreviewItem] = React.useState<UploadItem | null>(null);
  const [previewText, setPreviewText] = React.useState<string>("");
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  const computedNameForIndex = React.useCallback(
    (index: number) => {
      const trimmed = baseName.trim();
      if (!trimmed) return "";
      return index === 0 ? trimmed : `${trimmed}${index}`;
    },
    [baseName]
  );

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const next: UploadItem[] = [...items];

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      next.push({ id: makeId(file), file, previewUrl: url });
    }

    onChange(next);

    // allow selecting the same file again
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeItem = (id: string) => {
    const found = items.find((i) => i.id === id);
    if (found) URL.revokeObjectURL(found.previewUrl);
    onChange(items.filter((i) => i.id !== id));
  };

  React.useEffect(() => {
    return () => {
      // cleanup on unmount
      for (const item of latestItemsRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!previewItem) {
        setPreviewText("");
        setPreviewLoading(false);
        return;
      }

      const type = (previewItem.file.type ?? "").toLowerCase();
      const isTxt = type.startsWith("text/") || previewItem.file.name.toLowerCase().endsWith(".txt");
      if (!isTxt) {
        setPreviewText("");
        setPreviewLoading(false);
        return;
      }

      try {
        setPreviewLoading(true);
        const txt = await previewItem.file.text();
        if (!cancelled) setPreviewText(txt.slice(0, 20000));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [previewItem]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label}*</Label>
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="text-xs text-muted-foreground">You can upload multiple files. A preview will appear when available.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => {
            const displayName = computedNameForIndex(idx);
            const type = (item.file.type ?? "").toLowerCase();
            const isImage = type.startsWith("image/");
            const isVideo = type.startsWith("video/");

            return (
              <Card key={item.id} className="relative overflow-hidden">
                <div className="absolute right-2 top-2 z-10 flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setPreviewItem(item)}
                    aria-label="Preview file"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove file"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="aspect-video w-full bg-muted">
                  {isImage ? (
                    <img
                      src={item.previewUrl}
                      alt={displayName ? `Preview ${displayName}` : "Preview"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : isVideo ? (
                    <video className="h-full w-full object-cover" controls preload="metadata">
                      <source src={item.previewUrl} type={item.file.type} />
                    </video>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-4">
                      <p className="text-sm text-muted-foreground text-center break-words">{item.file.name}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1 p-3">
                  <p className="text-sm font-medium text-foreground">{displayName || "(set Media Title)"}</p>
                  <p className="text-xs text-muted-foreground break-all">{item.file.name}</p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <Dialog open={Boolean(previewItem)} onOpenChange={(open) => (!open ? setPreviewItem(null) : null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription className="sr-only">Preview selected file</DialogDescription>
          </DialogHeader>

          {previewItem ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground break-all">{previewItem.file.name}</p>
              <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                {(() => {
                  const type = (previewItem.file.type ?? "").toLowerCase();
                  const ext = (previewItem.file.name.split(".").pop() ?? "").toLowerCase();

                  if (type.startsWith("image/")) {
                    return <img src={previewItem.previewUrl} alt="Preview" className="h-full w-full object-contain" />;
                  }

                  if (type.startsWith("video/")) {
                    return <video src={previewItem.previewUrl} className="h-full w-full" controls />;
                  }

                  if (type === "application/pdf" || ext === "pdf") {
                    return <iframe title="PDF preview" src={previewItem.previewUrl} className="h-full w-full" />;
                  }

                  if (type.startsWith("text/") || ext === "txt") {
                    return (
                      <div className="h-full w-full overflow-auto p-4">
                        {previewLoading ? (
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : previewText ? (
                          <pre className="text-xs text-foreground whitespace-pre-wrap break-words">{previewText}</pre>
                        ) : (
                          <p className="text-sm text-muted-foreground">No preview</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
                      <p className="text-sm text-muted-foreground">Preview not available in browser.</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(previewItem.previewUrl, "_blank", "noopener,noreferrer")}
                      >
                        Open file
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
