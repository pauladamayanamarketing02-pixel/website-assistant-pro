import * as React from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
            const isImage = item.file.type.startsWith("image/");
            const isVideo = item.file.type.startsWith("video/");

            return (
              <Card key={item.id} className="relative overflow-hidden">
                <div className="absolute right-2 top-2 z-10">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove file"
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
                      <p className="text-sm text-muted-foreground text-center break-words">
                        {item.file.name}
                      </p>
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
    </div>
  );
}
