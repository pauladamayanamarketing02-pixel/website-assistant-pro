import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Eye, FileIcon, ImageIcon, Plus, Trash2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

type MediaType = "image" | "video" | "file";

type MediaFilter = "all" | "image" | "video" | "file";

type MediaItem = {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  createdAt: string;
};

const filterLabel: Record<MediaFilter, string> = {
  all: "All",
  file: "Files",
  image: "Images",
  video: "Videos",
};

function detectMediaType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

function iconFor(type: MediaType) {
  if (type === "image") return <ImageIcon className="h-4 w-4" />;
  if (type === "video") return <Video className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

export default function AdminWebsiteMedia() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [preview, setPreview] = useState<MediaItem | null>(null);

  const [items, setItems] = useState<MediaItem[]>(() => [
    {
      id: "m-1001",
      name: "hero-image.jpg",
      type: "image",
      url: "https://images.unsplash.com/photo-1520975693415-35a7f8c1c0a3?auto=format&fit=crop&w=1400&q=80",
      createdAt: "2026-01-10",
    },
    {
      id: "m-1002",
      name: "promo-video.mp4",
      type: "video",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      createdAt: "2026-01-12",
    },
    {
      id: "m-1003",
      name: "brand-guidelines.pdf",
      type: "file",
      url: "https://example.com/brand-guidelines.pdf",
      createdAt: "2026-01-14",
    },
  ]);

  // Cleanup object URLs created from uploads
  useEffect(() => {
    return () => {
      items.forEach((it) => {
        if (it.url.startsWith("blob:")) URL.revokeObjectURL(it.url);
      });
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => it.type === filter);
  }, [filter, items]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const next: MediaItem[] = Array.from(files).map((f) => {
      const type = detectMediaType(f);
      const url = URL.createObjectURL(f);
      return {
        id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: f.name,
        type,
        url,
        createdAt: new Date().toISOString().slice(0, 10),
      };
    });

    setItems((prev) => [...next, ...prev]);

    toast({
      title: "Uploaded",
      description: `${files.length} media file(s) added to the library (local preview).`,
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Copied", description: "URL copied to clipboard." });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy the URL. Please try again.",
      });
    }
  };

  const handleDelete = (id: string) => {
    setItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });

    toast({ title: "Deleted", description: "Media item removed." });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground">Upload and manage files used across the website.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip"
          />
          <Button type="button" onClick={handleUploadClick}>
            <Upload className="h-4 w-4" />
            Add New Media Files
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Media Management</CardTitle>
              <p className="text-sm text-muted-foreground">Browse the library and manage assets.</p>
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as MediaFilter)}>
              <TabsList>
                {(Object.keys(filterLabel) as MediaFilter[]).map((k) => (
                  <TabsTrigger key={k} value={k}>
                    {filterLabel[k]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No media files found.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-card">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={`Media preview for ${item.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : item.type === "video" ? (
                      <video src={item.url} className="h-full w-full object-cover" muted controls />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        {iconFor(item.type)}
                        <span className="max-w-[70%] truncate">{item.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">Added: {item.createdAt}</div>
                      </div>
                      <div className="mt-0.5 text-muted-foreground">{iconFor(item.type)}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopyUrl(item.url)}>
                        <Copy className="h-4 w-4" />
                        Copy URL
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPreview(item)}>
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(open) => (!open ? setPreview(null) : null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>

          {!preview ? null : preview.type === "image" ? (
            <img
              src={preview.url}
              alt={`Preview of ${preview.name}`}
              className="w-full rounded-md border border-border"
              loading="lazy"
            />
          ) : preview.type === "video" ? (
            <video src={preview.url} className="w-full rounded-md border border-border" controls />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {iconFor(preview.type)}
                <span className="font-medium text-foreground">{preview.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopyUrl(preview.url)}>
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={preview.url} target="_blank" rel="noreferrer">
                    <Plus className="h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
