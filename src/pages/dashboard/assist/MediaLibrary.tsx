import * as React from "react";

import { Lock, Unlock } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ImportType = "Gambar" | "Video";

type BusinessOption = {
  id: string;
  name: string;
  userId: string;
};

type MediaTypeOption = {
  id: string;
  name: string;
  key: string; // normalized key for lookups (lowercase/trim)
};

type MediaRow = {
  id: string;
  businessId: string;
  businessName: string;
  category: string;
  typeCounts: Record<string, number>; // by MediaTypeOption.key
};

const IMPORT_TYPES: ImportType[] = ["Gambar", "Video"];

const FALLBACK_ROWS: MediaRow[] = [
  {
    id: "demo-1",
    businessId: "demo",
    businessName: "Demo Business",
    category: "All",
    typeCounts: { gambar: 8, video: 2 },
  },
  {
    id: "demo-2",
    businessId: "demo",
    businessName: "Demo Business",
    category: "All",
    typeCounts: { gambar: 14, video: 4 },
  },
];

function safeName(name: string | null | undefined) {
  return (name ?? "(No name)").trim() || "(No name)";
}

function lockKey(name: string) {
  return (name ?? "").trim().toLowerCase();
}

const PERMANENT_CONTENT_TYPES = new Set(["gambar", "video"]);

function uniqueNonEmpty(values: string[]) {
  const set = new Set<string>();
  for (const v of values) {
    const cleaned = (v ?? "").trim();
    if (!cleaned) continue;
    set.add(cleaned);
  }
  return Array.from(set);
}


export default function AssistMediaLibrary() {
  const { toast } = useToast();

  const [lastImportType, setLastImportType] = React.useState<ImportType | null>(null);
  const [businesses, setBusinesses] = React.useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string>("all");

  // Category + Media Type management (media_categories + media_types)
  const [categories, setCategories] = React.useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = React.useState<MediaTypeOption[]>([]);
  const visibleMediaTypeNames = React.useMemo(() => uniqueNonEmpty(mediaTypes.map((t) => t.name)), [mediaTypes]);
  const [lockedCategories, setLockedCategories] = React.useState<Set<string>>(() => new Set());
  const [lockedContentTypes, setLockedContentTypes] = React.useState<Set<string>>(() => new Set());

  const [manageTab, setManageTab] = React.useState<"category" | "content">("category");

  const [newCategory, setNewCategory] = React.useState("");
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [editingCategoryDraft, setEditingCategoryDraft] = React.useState("");

  const [newContentType, setNewContentType] = React.useState("");
  const [editingContentType, setEditingContentType] = React.useState<string | null>(null);
  const [editingContentTypeDraft, setEditingContentTypeDraft] = React.useState("");

  type ConfirmActionState =
    | { kind: "delete_category"; name: string }
    | { kind: "save_edit_category" }
    | { kind: "delete_type"; name: string }
    | { kind: "save_edit_type" };

  const [confirmAction, setConfirmAction] = React.useState<ConfirmActionState | null>(null);

  const resolveCategoryId = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) throw new Error("Category is required.");

    const { data: existing, error: selectError } = await supabase
      .from("media_categories")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing?.id) return existing.id as string;

    const { data: created, error: insertError } = await supabase
      .from("media_categories")
      .insert({ name: cleaned })
      .select("id")
      .single();

    if (insertError) throw insertError;
    return created.id as string;
  };

  const resolveContentTypeId = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) throw new Error("Type Content is required.");

    const { data: existing, error: selectError } = await supabase
      .from("media_types")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing?.id) return existing.id as string;

    const { data: created, error: insertError } = await supabase
      .from("media_types")
      .insert({ name: cleaned })
      .select("id")
      .single();

    if (insertError) throw insertError;
    return created.id as string;
  };

  const lookupCategoryIdInsensitive = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return null;

    const { data, error } = await supabase
      .from("media_categories")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
  };

  const lookupContentTypeIdInsensitive = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return null;

    const { data, error } = await supabase
      .from("media_types")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
  };

  const refreshCategories = React.useCallback(async () => {
    const { data, error } = await supabase.from("media_categories").select("name, is_locked").order("name", { ascending: true });
    if (error) throw error;

    const rows = (data ?? []) as Array<{ name: string; is_locked?: boolean }>;
    setCategories(uniqueNonEmpty(rows.map((r) => r.name)));
    setLockedCategories(new Set(rows.filter((r) => Boolean(r.is_locked)).map((r) => lockKey(r.name))));
  }, []);

  const refreshContentTypes = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("media_types")
      .select("id, name, is_locked")
      .order("name", { ascending: true });
    if (error) throw error;

    const rows = (data ?? []) as Array<{ id: string; name: string; is_locked?: boolean }>;

    // Build a unique list of types by normalized key and ensure defaults (gambar/video) are always present.
    const byKey = new Map<string, MediaTypeOption>();

    for (const t of IMPORT_TYPES) {
      const key = lockKey(t);
      byKey.set(key, { id: `__default_${key}`, name: t, key });
    }

    for (const r of rows) {
      const key = lockKey(r.name);
      byKey.set(key, { id: r.id, name: r.name, key });
    }

    setMediaTypes(Array.from(byKey.values()));

    const locked = new Set(rows.filter((r) => Boolean(r.is_locked)).map((r) => lockKey(r.name)));
    for (const k of PERMANENT_CONTENT_TYPES) locked.add(k);
    setLockedContentTypes(locked);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [{ data: bizData, error: bizError }, { data: catData }, { data: typeData }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, business_name, user_id")
          .order("business_name", { ascending: true, nullsFirst: false }),
        supabase.from("media_categories").select("name, is_locked").order("name", { ascending: true }),
        supabase.from("media_types").select("id, name, is_locked").order("name", { ascending: true }),
      ]);

      if (cancelled) return;

      if (bizError) {
        setBusinesses([]);
      } else {
        setBusinesses(
          (bizData ?? []).map((b: any) => ({
            id: b.id,
            name: safeName(b.business_name),
            userId: b.user_id,
          }))
        );
      }

      const catRows = (catData ?? []) as Array<{ name: string; is_locked?: boolean }>;
      setCategories(uniqueNonEmpty(catRows.map((c) => c.name)));
      setLockedCategories(new Set(catRows.filter((c) => Boolean(c.is_locked)).map((c) => lockKey(c.name))));

      const typeRows = (typeData ?? []) as Array<{ id: string; name: string; is_locked?: boolean }>;

      const byKey = new Map<string, MediaTypeOption>();
      for (const t of IMPORT_TYPES) {
        const key = lockKey(t);
        byKey.set(key, { id: `__default_${key}`, name: t, key });
      }
      for (const r of typeRows) {
        const key = lockKey(r.name);
        byKey.set(key, { id: r.id, name: r.name, key });
      }
      setMediaTypes(Array.from(byKey.values()));

      const locked = new Set(typeRows.filter((t) => Boolean(t.is_locked)).map((t) => lockKey(t.name)));
      for (const k of PERMANENT_CONTENT_TYPES) locked.add(k);
      setLockedContentTypes(locked);

    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const openManage = (tab: "category" | "content") => {
    setManageTab(tab);
    setManageDialogOpen(true);
    void refreshCategories();
    void refreshContentTypes();
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Category already exists", description: `Category \"${name}\" is already registered.` });
      return;
    }

    try {
      await resolveCategoryId(name);
      await refreshCategories();
      setNewCategory("");
      toast({ title: "Saved", description: "Category saved to database." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" });
    }
  };

  const startEditCategory = (name: string) => {
    setEditingCategory(name);
    setEditingCategoryDraft(name);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryDraft("");
  };

  const saveEditCategory = async () => {
    const from = (editingCategory ?? "").trim();
    const to = editingCategoryDraft.trim();
    if (!from || !to) return;

    if (categories.some((c) => c !== from && c.toLowerCase() === to.toLowerCase())) {
      toast({ title: "Category name conflict", description: `Category \"${to}\" already exists.` });
      return;
    }

    try {
      const id = await lookupCategoryIdInsensitive(from);
      if (!id) throw new Error("Category not found in database.");

      const { error } = await supabase.from("media_categories").update({ name: to }).eq("id", id);
      if (error) throw error;

      await refreshCategories();
      cancelEditCategory();
      toast({ title: "Saved", description: "Category updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" });
    }
  };

  const deleteCategory = async (name: string) => {
    try {
      const id = await lookupCategoryIdInsensitive(name);
      if (!id) throw new Error("Category not found in database.");

      const { error } = await supabase.from("media_categories").delete().eq("id", id);
      if (error) throw error;

      await refreshCategories();
      toast({ title: "Deleted", description: "Category deleted." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e?.message ?? "Category may be in use by existing items.",
      });
    }
  };

  const toggleCategoryLock = async (name: string) => {
    try {
      const cleaned = name.trim();
      const { data, error } = await supabase
        .from("media_categories")
        .select("id, is_locked")
        .ilike("name", cleaned)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Category not found in database.");

      const nextLocked = !Boolean((data as any).is_locked);
      const { error: updateError } = await supabase.from("media_categories").update({ is_locked: nextLocked }).eq("id", (data as any).id);
      if (updateError) throw updateError;

      await refreshCategories();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e?.message ?? "Failed to toggle lock." });
    }
  };

  const addContentType = async () => {
    const name = newContentType.trim();
    if (!name) return;

    const key = lockKey(name);
    if (mediaTypes.some((t) => t.key === key)) {
      toast({ title: "Type already exists", description: `Type Content \"${name}\" is already registered.` });
      return;
    }

    try {
      await resolveContentTypeId(name);
      await refreshContentTypes();
      setNewContentType("");
      toast({ title: "Saved", description: "Type Content saved to database." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" });
    }
  };

  const startEditContentType = (name: string) => {
    setEditingContentType(name);
    setEditingContentTypeDraft(name);
  };

  const cancelEditContentType = () => {
    setEditingContentType(null);
    setEditingContentTypeDraft("");
  };

  const saveEditContentType = async () => {
    const from = (editingContentType ?? "").trim();
    const to = editingContentTypeDraft.trim();
    if (!from || !to) return;

    const fromKey = lockKey(from);
    const toKey = lockKey(to);
    if (mediaTypes.some((t) => t.key !== fromKey && t.key === toKey)) {
      toast({ title: "Type name conflict", description: `Type Content \"${to}\" already exists.` });
      return;
    }

    try {
      const id = await lookupContentTypeIdInsensitive(from);
      if (!id) throw new Error("Type Content not found in database.");

      const { error } = await supabase.from("media_types").update({ name: to }).eq("id", id);
      if (error) throw error;

      await refreshContentTypes();
      cancelEditContentType();
      toast({ title: "Saved", description: "Type Content updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" });
    }
  };

  const deleteContentType = async (name: string) => {
    try {
      const key = lockKey(name);
      if (PERMANENT_CONTENT_TYPES.has(key)) {
        toast({ variant: "destructive", title: "Not allowed", description: "This Type Content is permanent." });
        return;
      }

      const id = await lookupContentTypeIdInsensitive(name);
      if (!id) throw new Error("Type Content not found in database.");

      const { error } = await supabase.from("media_types").delete().eq("id", id);
      if (error) throw error;

      await refreshContentTypes();
      toast({ title: "Deleted", description: "Type Content deleted." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e?.message ?? "Type Content may be in use by existing items.",
      });
    }
  };

  const toggleContentTypeLock = async (name: string) => {
    const key = lockKey(name);
    if (PERMANENT_CONTENT_TYPES.has(key)) return;

    try {
      const cleaned = name.trim();
      const { data, error } = await supabase
        .from("media_types")
        .select("id, is_locked")
        .ilike("name", cleaned)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Type Content not found in database.");

      const nextLocked = !Boolean((data as any).is_locked);
      const { error: updateError } = await supabase.from("media_types").update({ is_locked: nextLocked }).eq("id", (data as any).id);
      if (updateError) throw updateError;

      await refreshContentTypes();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e?.message ?? "Failed to toggle lock." });
    }
  };

  const getConfirmCopy = React.useCallback(() => {
    if (!confirmAction) return null;

    switch (confirmAction.kind) {
      case "delete_category":
        return {
          title: "Delete category?",
          description: `Are you sure you want to delete \"${confirmAction.name}\"? This action cannot be undone.`,
          confirmLabel: "Yes, delete",
        };
      case "save_edit_category":
        return {
          title: "Save changes?",
          description: `Save changes to category \"${editingCategory ?? ""}\"?`,
          confirmLabel: "Yes, save",
        };
      case "delete_type":
        return {
          title: "Delete type content?",
          description: `Are you sure you want to delete \"${confirmAction.name}\"? This action cannot be undone.`,
          confirmLabel: "Yes, delete",
        };
      case "save_edit_type":
        return {
          title: "Save changes?",
          description: `Save changes to type content \"${editingContentType ?? ""}\"?`,
          confirmLabel: "Yes, save",
        };
    }
  }, [confirmAction, editingCategory, editingContentType]);

  const confirmCopy = getConfirmCopy();

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.kind) {
        case "delete_category":
          await deleteCategory(confirmAction.name);
          break;
        case "save_edit_category":
          await saveEditCategory();
          break;
        case "delete_type":
          await deleteContentType(confirmAction.name);
          break;
        case "save_edit_type":
          await saveEditContentType();
          break;
      }
    } finally {
      setConfirmAction(null);
    }
  };

  const [mediaRows, setMediaRows] = React.useState<MediaRow[]>([]);
  const [mediaRowsLoading, setMediaRowsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      if (businesses.length === 0) {
        setMediaRows([]);
        return;
      }

      setMediaRowsLoading(true);
      try {
        const userIds = Array.from(new Set(businesses.map((b) => b.userId).filter(Boolean)));
        if (userIds.length === 0) {
          setMediaRows([]);
          return;
        }

        // Build helpers from current mediaTypes
        const knownTypeKeys = mediaTypes.map((t) => t.key);
        const typeIdToKey = new Map<string, string>();
        for (const t of mediaTypes) {
          if (!t.id.startsWith("__default_")) typeIdToKey.set(t.id, t.key);
        }

        const gambarKey = mediaTypes.find((t) => t.key === "gambar")?.key;
        const videoKey = mediaTypes.find((t) => t.key === "video")?.key;

        const { data: galleryData, error } = await supabase
          .from("user_gallery")
          .select("user_id, type, media_type_id")
          .in("user_id", userIds);

        if (error) throw error;

        const countsByUser: Record<string, Record<string, number>> = {};

        const ensureUserInit = (userId: string) => {
          if (!countsByUser[userId]) {
            const init: Record<string, number> = {};
            for (const k of knownTypeKeys) init[k] = 0;
            countsByUser[userId] = init;
          }
          return countsByUser[userId];
        };

        for (const item of (galleryData ?? []) as Array<{ user_id: string; type: string; media_type_id: string | null }>) {
          const userId = item.user_id;
          const userCounts = ensureUserInit(userId);

          const mappedKey = item.media_type_id ? typeIdToKey.get(item.media_type_id) : undefined;
          if (mappedKey) {
            userCounts[mappedKey] = (userCounts[mappedKey] ?? 0) + 1;
            continue;
          }

          // Fallback mapping by MIME type for legacy rows that don't have media_type_id.
          const mime = (item.type ?? "").toLowerCase();
          if (mime.startsWith("image/") && gambarKey) userCounts[gambarKey] = (userCounts[gambarKey] ?? 0) + 1;
          else if (mime.startsWith("video/") && videoKey) userCounts[videoKey] = (userCounts[videoKey] ?? 0) + 1;
        }

        const nextRows: MediaRow[] = businesses.map((b) => {
          const typeCounts = countsByUser[b.userId] ?? Object.fromEntries(knownTypeKeys.map((k) => [k, 0]));
          return {
            id: `${b.id}-all`,
            businessId: b.id,
            businessName: b.name,
            category: "All",
            typeCounts,
          };
        });

        if (!cancelled) setMediaRows(nextRows);
      } catch {
        if (!cancelled) setMediaRows([]);
      } finally {
        if (!cancelled) setMediaRowsLoading(false);
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [businesses, mediaTypes]);

  const rows: MediaRow[] = React.useMemo(() => {
    if (mediaRows.length > 0) return mediaRows;

    const typeKeys = mediaTypes.map((t) => t.key);
    const emptyTypeCounts = Object.fromEntries(typeKeys.map((k) => [k, 0] as const));

    if (businesses.length > 0 && mediaRowsLoading) {
      return businesses.map((b) => ({
        id: `${b.id}-all`,
        businessId: b.id,
        businessName: b.name,
        category: "All",
        typeCounts: emptyTypeCounts,
      }));
    }

    return FALLBACK_ROWS;
  }, [mediaRows, businesses, mediaRowsLoading, mediaTypes]);

  const displayedRows = React.useMemo(() => {
    const filtered = selectedBusinessId === "all" ? rows : rows.filter((r) => r.businessId === selectedBusinessId);

    return [...filtered].sort((a, b) => {
      const byBusiness = a.businessName.localeCompare(b.businessName, "en", { sensitivity: "base" });
      if (byBusiness !== 0) return byBusiness;
      return a.category.localeCompare(b.category, "en", { sensitivity: "base" });
    });
  }, [rows, selectedBusinessId]);

  const onImport = (type: ImportType) => {
    setLastImportType(type);
    toast({
      title: "In Progress",
      description: `Import \"${type}\" is in progress.`,
    });
  };


  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground">Manage media assets (images & video) for clients.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button">Add</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary">
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 w-64">
              {IMPORT_TYPES.map((t) => (
                <DropdownMenuItem key={t} onClick={() => onImport(t)}>
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Media Management</CardTitle>
            {lastImportType ? (
              <p className="text-sm text-muted-foreground">Last selected: {lastImportType}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Filter by business name" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Businesses</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" variant="secondary" onClick={() => openManage("category")}>
              Manage
            </Button>

          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Gambar</TableHead>
                <TableHead className="text-right">Video</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {displayedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.businessName}</TableCell>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell className="text-right">{row.imagesGallery}</TableCell>
                  <TableCell className="text-right">{row.videoContent}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "View Details",
                          description: `Business: ${row.businessName} • Category: ${row.category} (placeholder).`,
                        })
                      }
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No data for the selected business.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage dialog (Category / Type Content) */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage</DialogTitle>
            <DialogDescription className="sr-only">Manage categories and content types.</DialogDescription>
          </DialogHeader>

          <Tabs value={manageTab} onValueChange={(v) => setManageTab(v as "category" | "content")}>
            <TabsList>
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="content">Type Content</TabsTrigger>
            </TabsList>

            <TabsContent value="category" className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name..." />
                <Button type="button" onClick={addCategory}>
                  Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => {
                    const isEditing = editingCategory === c;
                    const isLocked = lockedCategories.has(lockKey(c));

                    return (
                      <TableRow key={c}>
                        <TableCell>
                          {isEditing ? (
                            <Input value={editingCategoryDraft} onChange={(e) => setEditingCategoryDraft(e.target.value)} />
                          ) : (
                            <span className="font-medium">{c}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isEditing}
                              onClick={() => toggleCategoryLock(c)}
                              aria-label={isLocked ? "Unlock" : "Lock"}
                              title={isLocked ? "Unlock" : "Lock"}
                            >
                              {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </Button>

                            {isEditing ? (
                              <>
                                <Button type="button" size="sm" onClick={() => setConfirmAction({ kind: "save_edit_category" })}>
                                  Save
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={cancelEditCategory}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isLocked}
                                onClick={() => startEditCategory(c)}
                              >
                                Edit
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isLocked}
                              onClick={() => setConfirmAction({ kind: "delete_category", name: c })}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                        No categories yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={newContentType}
                  onChange={(e) => setNewContentType(e.target.value)}
                  placeholder="Type Content name..."
                />
                <Button type="button" onClick={addContentType}>
                  Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Content</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentTypes.map((t) => {
                    const key = lockKey(t);
                    const isPermanent = PERMANENT_CONTENT_TYPES.has(key);
                    const isEditing = editingContentType === t;
                    const isLocked = isPermanent || lockedContentTypes.has(key);

                    return (
                      <TableRow key={t}>
                        <TableCell>
                          {isEditing ? (
                            <Input value={editingContentTypeDraft} onChange={(e) => setEditingContentTypeDraft(e.target.value)} />
                          ) : (
                            <span className="font-medium">{t}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isEditing || isPermanent}
                              onClick={() => toggleContentTypeLock(t)}
                              aria-label={isLocked ? "Unlock" : "Lock"}
                              title={isPermanent ? "Permanent" : isLocked ? "Unlock" : "Lock"}
                            >
                              {isPermanent ? (
                                <Lock className="h-4 w-4" />
                              ) : isLocked ? (
                                <Unlock className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </Button>

                            {isEditing ? (
                              <>
                                <Button type="button" size="sm" onClick={() => setConfirmAction({ kind: "save_edit_type" })}>
                                  Save
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={cancelEditContentType}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isLocked}
                                onClick={() => startEditContentType(t)}
                              >
                                Edit
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isLocked}
                              onClick={() => setConfirmAction({ kind: "delete_type", name: t })}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {contentTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                        No types yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          <AlertDialog open={!!confirmAction} onOpenChange={(open) => (!open ? setConfirmAction(null) : undefined)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
                <AlertDialogDescription>{confirmCopy?.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>{confirmCopy?.confirmLabel ?? "Yes"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setManageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
