import * as React from "react";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export type MediaDetailsItem = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number | null;
  createdAt: string;
  categoryName: string;
  mediaTypeName: string;
};

type CategoryOption = { id: string; name: string };

type MediaTypeOption = { id: string; name: string; key: string };

type Props = {
  businessName: string;
  userId: string;
  categories: string[];
  categoryOptions: CategoryOption[];
  mediaTypes: MediaTypeOption[];
  initialCategory?: string;
  onBack: () => void;
};

export default function MediaDetailsView({
  businessName,
  userId,
  categories,
  categoryOptions,
  mediaTypes,
  initialCategory,
  onBack,
}: Props) {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<MediaDetailsItem[]>([]);

  const [sortCategory, setSortCategory] = React.useState<string>(initialCategory && initialCategory !== "All" ? initialCategory : "");
  const [sortTypeContent, setSortTypeContent] = React.useState<string>("");

  const categoryNameToId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoryOptions) map.set(c.name, c.id);
    return map;
  }, [categoryOptions]);

  const mediaTypeNameToId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const t of mediaTypes) {
      // only real DB types have UUID ids
      if (!t.id.startsWith("__default_")) map.set(t.name, t.id);
    }
    return map;
  }, [mediaTypes]);

  const mediaTypeIdToName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const t of mediaTypes) {
      if (!t.id.startsWith("__default_")) map.set(t.id, t.name);
    }
    return map;
  }, [mediaTypes]);

  const categoryIdToName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoryOptions) map.set(c.id, c.name);
    return map;
  }, [categoryOptions]);

  const fetchItems = React.useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("user_gallery")
      .select("id, name, url, type, size, created_at, media_category_id, media_type_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (sortCategory) {
      const categoryId = categoryNameToId.get(sortCategory);
      if (categoryId) query = query.eq("media_category_id", categoryId);
    }

    if (sortTypeContent) {
      const typeId = mediaTypeNameToId.get(sortTypeContent);
      if (typeId) query = query.eq("media_type_id", typeId);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      setItems([]);
      setLoading(false);
      return;
    }

    const next: MediaDetailsItem[] = ((data ?? []) as any[]).map((d) => {
      const categoryName = d.media_category_id ? categoryIdToName.get(d.media_category_id) ?? "" : "";
      const mediaTypeName = d.media_type_id ? mediaTypeIdToName.get(d.media_type_id) ?? "" : "";
      return {
        id: d.id as string,
        name: (d.name ?? "") as string,
        url: (d.url ?? "") as string,
        type: (d.type ?? "") as string,
        size: (d.size ?? null) as number | null,
        createdAt: (d.created_at ?? "") as string,
        categoryName,
        mediaTypeName,
      };
    });

    setItems(next);
    setLoading(false);
  }, [userId, sortCategory, sortTypeContent, categoryNameToId, mediaTypeNameToId, categoryIdToName, mediaTypeIdToName]);

  React.useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="mt-0.5" onClick={onBack} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">View Details</h1>
            <p className="text-muted-foreground">{businessName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={sortCategory || "all"}
            onValueChange={(v) => {
              const next = v === "all" ? "" : v;
              setSortCategory(next);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Sort by Category" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortTypeContent || "all"}
            onValueChange={(v) => {
              const next = v === "all" ? "" : v;
              setSortTypeContent(next);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Sort by Type Content" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Types</SelectItem>
              {mediaTypes
                .filter((t) => !t.id.startsWith("__default_"))
                .map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Media Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}

          {!loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No media found for the selected filters.</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const isImage = (item.type ?? "").toLowerCase().startsWith("image/");
              const isVideo = (item.type ?? "").toLowerCase().startsWith("video/");
              const createdLabel = item.createdAt ? new Date(item.createdAt).toLocaleString("en-US") : "-";

              return (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video w-full bg-muted">
                    {isImage ? (
                      <img src={item.url} alt={item.name || "Media preview"} className="h-full w-full object-cover" loading="lazy" />
                    ) : isVideo ? (
                      <video src={item.url} className="h-full w-full object-cover" controls />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No preview</div>
                    )}
                  </div>

                  <CardContent className="space-y-1 p-3">
                    <p className="text-sm font-semibold text-foreground break-all">{item.name || "(no name)"}</p>
                    <p className="text-xs text-muted-foreground">{item.categoryName || "-"} • {item.mediaTypeName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{createdLabel}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
