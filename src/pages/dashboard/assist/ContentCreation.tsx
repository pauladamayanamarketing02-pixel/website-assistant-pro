import * as React from "react";

import { ArrowLeft, Lock, Unlock, Pencil } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageFieldCard from "@/components/dashboard/ImageFieldCard";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import PlatformDropdown from "@/pages/dashboard/assist/content-creation/PlatformDropdown";
import ContentItemForm from "@/pages/dashboard/assist/content-creation/ContentItemForm";

type SortDirection = "asc" | "desc";

type BusinessOption = {
  id: string;
  name: string;
  publicId?: string;
};

type ContentRow = {
  id: string;
  businessId: string;
  businessName: string;
  category: string;
  counts: Record<string, number>;
};

const DEFAULT_CONTENT_TYPES = [
  "Social Media Posts",
  "Content Media Posts",
  "GMB Posts",
  "Email Marketing",
  "Ads Marketing",
] as const;

const FALLBACK_ROWS: ContentRow[] = [
  {
    id: "demo-1",
    businessId: "demo",
    businessName: "Demo Business",
    category: "General",
    counts: {
      "Social Media Posts": 12,
      "Content Media Posts": 6,
      "GMB Posts": 4,
      "Email Marketing": 3,
      "Ads Marketing": 2,
    },
  },
];

function safeName(name: string | null | undefined) {
  return (name ?? "(No name)").trim() || "(No name)";
}

function lockKey(name: string) {
  return (name ?? "").trim().toLowerCase();
}

function formatBusinessId(businessNumber: number | null | undefined) {
  if (!businessNumber) return "";
  return `B${businessNumber.toString().padStart(5, "0")}`;
}

function uniqueNonEmpty(values: string[]) {
  const set = new Set<string>();
  for (const v of values) {
    const cleaned = (v ?? "").trim();
    if (!cleaned) continue;
    set.add(cleaned);
  }
  return Array.from(set);
}

function toDatetimeLocalInput(isoString: string) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

type ImageSlotKey = "primary" | "second" | "third";

type ImageSlotState = {
  url: string;
  originalUrl: string;
};

export default function ContentCreation() {
  const { toast } = useToast();

  const [lastImportType, setLastImportType] = React.useState<string | null>(null);
  const [businesses, setBusinesses] = React.useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string>("all");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  // Create (full page, not overlay)
  const [createOpen, setCreateOpen] = React.useState(false);

  // View Details (full page, not overlay)
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState<ContentRow | null>(null);
  const [detailsItemId, setDetailsItemId] = React.useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsSaving, setDetailsSaving] = React.useState(false);

  const [detailsForm, setDetailsForm] = React.useState({
    title: "",
    description: "",
    category: "",
    contentType: "",
    platform: "",
    scheduledAt: "", // datetime-local string
  });

  const [detailsSortCategory, setDetailsSortCategory] = React.useState<string>("");
  const [detailsSortTypeContent, setDetailsSortTypeContent] = React.useState<string>("");

  const [images, setImages] = React.useState<Record<ImageSlotKey, ImageSlotState>>({
    primary: { url: "/placeholder.svg", originalUrl: "/placeholder.svg" },
    second: { url: "/placeholder.svg", originalUrl: "/placeholder.svg" },
    third: { url: "/placeholder.svg", originalUrl: "/placeholder.svg" },
  });

  // Category + Content column management (UI only for now)
  const [contentTypes, setContentTypes] = React.useState<string[]>(Array.from(DEFAULT_CONTENT_TYPES));
  const [categories, setCategories] = React.useState<string[]>(
    uniqueNonEmpty(["General", ...FALLBACK_ROWS.map((r) => r.category)]),
  );

  const [lockedCategories, setLockedCategories] = React.useState<Set<string>>(() => new Set());
  const [lockedContentTypes, setLockedContentTypes] = React.useState<Set<string>>(() => new Set());

  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);
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

  React.useEffect(() => {
    let cancelled = false;

    const loadBusinesses = async () => {
      const [{ data: bizData, error: bizError }, { data: catData }, { data: typeData }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, business_name, business_number")
          .order("business_name", { ascending: true, nullsFirst: false }),
        supabase.from("content_categories").select("name, is_locked").order("name", { ascending: true }),
        supabase.from("content_types").select("name, is_locked").order("name", { ascending: true }),
      ]);

      if (cancelled) return;

      if (bizError) {
        // Jangan blok UI — fallback ke data demo
        setBusinesses([]);
      } else {
        const list: BusinessOption[] = (bizData ?? []).map((b) => ({
          id: b.id,
          name: safeName(b.business_name),
          publicId: formatBusinessId((b as any).business_number as number | null),
        }));
        setBusinesses(list);
      }

      const catRows = (catData ?? []) as Array<{ name: string; is_locked?: boolean }>;
      const typeRows = (typeData ?? []) as Array<{ name: string; is_locked?: boolean }>;

      const catNames = catRows.map((c) => (c as any).name as string);
      const typeNames = typeRows.map((t) => (t as any).name as string);

      if (catNames.length) setCategories((prev) => uniqueNonEmpty([...prev, ...catNames]));
      if (typeNames.length) setContentTypes((prev) => uniqueNonEmpty([...prev, ...typeNames]));

      // Hydrate lock state from DB so it survives refresh
      setLockedCategories(new Set(catRows.filter((c) => Boolean(c.is_locked)).map((c) => lockKey(c.name))));
      setLockedContentTypes(new Set(typeRows.filter((t) => Boolean(t.is_locked)).map((t) => lockKey(t.name))));
    };

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows: ContentRow[] = React.useMemo(() => {
    const emptyCounts = Object.fromEntries(contentTypes.map((t) => [t, 0] as const));

    // Placeholder sampai data real dibuat: buat 1 baris per bisnis
    if (businesses.length > 0) {
      return businesses.map((b) => ({
        id: `${b.id}-general`,
        businessId: b.id,
        businessName: b.name,
        category: "General",
        counts: { ...emptyCounts },
      }));
    }

    return FALLBACK_ROWS;
  }, [businesses, contentTypes]);

  const displayedRows = React.useMemo(() => {
    const filtered = selectedBusinessId === "all" ? rows : rows.filter((r) => r.businessId === selectedBusinessId);

    const dir = sortDirection === "asc" ? 1 : -1;

    return [...filtered].sort(
      (a, b) => a.businessName.localeCompare(b.businessName, "id", { sensitivity: "base" }) * dir,
    );
  }, [rows, selectedBusinessId, sortDirection]);

  const onImport = (type: string) => {
    setLastImportType(type);
    toast({
      title: "Import selected",
      description: `You selected import: ${type}`,
    });
  };

  const openDetails = (row: ContentRow) => {
    setActiveRow(row);
    setDetailsItemId(null);
    setDetailsLoading(true);

    // Reset optimistic UI first
    setDetailsForm({
      title: "",
      description: "",
      category: "",
      contentType: "",
      platform: "",
      scheduledAt: "",
    });
    setDetailsSortCategory("");
    setDetailsSortTypeContent("");
    setImages({
      primary: { url: "", originalUrl: "" },
      second: { url: "", originalUrl: "" },
      third: { url: "", originalUrl: "" },
    });
    setDetailsOpen(true);

    // Load latest content item for this business (if any)
    void (async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select(
          "id, title, description, platform, scheduled_at, image_primary_url, image_second_url, image_third_url, content_categories(name), content_types(name)",
        )
        .eq("business_id", row.businessId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setDetailsLoading(false);
        toast({ variant: "destructive", title: "Failed to load", description: error.message });
        return;
      }

      if (!data) {
        setDetailsLoading(false);
        return;
      }

      const catName = (data as any).content_categories?.name as string | undefined;
      const typeName = (data as any).content_types?.name as string | undefined;

      setDetailsItemId(data.id);
      setDetailsForm({
        title: data.title ?? "",
        description: data.description ?? "",
        category: catName ?? "",
        contentType: typeName ?? "",
        platform: data.platform ?? "",
        scheduledAt: data.scheduled_at ? toDatetimeLocalInput(data.scheduled_at) : "",
      });
      setDetailsSortCategory(catName ?? "");
      setDetailsSortTypeContent(typeName ?? "");
      setImages({
        primary: { url: data.image_primary_url ?? "", originalUrl: data.image_primary_url ?? "" },
        second: { url: data.image_second_url ?? "", originalUrl: data.image_second_url ?? "" },
        third: { url: data.image_third_url ?? "", originalUrl: data.image_third_url ?? "" },
      });
      setDetailsLoading(false);
    })();
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setActiveRow(null);
    setDetailsItemId(null);
    setDetailsLoading(false);
    setDetailsSaving(false);
  };

  const resolveCategoryId = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) throw new Error("Category is required.");

    const { data: existing, error: selectError } = await supabase
      .from("content_categories")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing?.id) return existing.id as string;

    const { data: created, error: insertError } = await supabase
      .from("content_categories")
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
      .from("content_types")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing?.id) return existing.id as string;

    const { data: created, error: insertError } = await supabase
      .from("content_types")
      .insert({ name: cleaned })
      .select("id")
      .single();

    if (insertError) throw insertError;
    return created.id as string;
  };

  const lookupCategoryId = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return null;

    const { data, error } = await supabase
      .from("content_categories")
      .select("id")
      .eq("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
  };

  const lookupContentTypeId = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return null;

    const { data, error } = await supabase
      .from("content_types")
      .select("id")
      .eq("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
  };

  const fetchDetailsItem = async (categoryName: string, typeName: string) => {
    if (!activeRow) return;

    setDetailsLoading(true);
    try {
      const [categoryId, contentTypeId] = await Promise.all([
        categoryName ? lookupCategoryId(categoryName) : Promise.resolve(null),
        typeName ? lookupContentTypeId(typeName) : Promise.resolve(null),
      ]);

      let q = supabase
        .from("content_items")
        .select(
          "id, title, description, platform, scheduled_at, image_primary_url, image_second_url, image_third_url, content_categories(name), content_types(name)",
        )
        .eq("business_id", activeRow.businessId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (categoryId) q = q.eq("category_id", categoryId);
      if (contentTypeId) q = q.eq("content_type_id", contentTypeId);

      const { data, error } = await q.maybeSingle();
      if (error) throw error;

      if (!data) {
        setDetailsItemId(null);
        setDetailsForm((p) => ({
          ...p,
          title: "",
          description: "",
          platform: "",
          scheduledAt: "",
        }));
        setImages({
          primary: { url: "", originalUrl: "" },
          second: { url: "", originalUrl: "" },
          third: { url: "", originalUrl: "" },
        });
        toast({ title: "No content found", description: "No items match the selected filters." });
        return;
      }

      const cat = (data as any).content_categories?.name as string | undefined;
      const type = (data as any).content_types?.name as string | undefined;

      setDetailsItemId(data.id);
      setDetailsForm({
        title: data.title ?? "",
        description: data.description ?? "",
        category: cat ?? categoryName,
        contentType: type ?? typeName,
        platform: data.platform ?? "",
        scheduledAt: data.scheduled_at ? toDatetimeLocalInput(data.scheduled_at) : "",
      });
      setImages({
        primary: { url: data.image_primary_url ?? "", originalUrl: data.image_primary_url ?? "" },
        second: { url: data.image_second_url ?? "", originalUrl: data.image_second_url ?? "" },
        third: { url: data.image_third_url ?? "", originalUrl: data.image_third_url ?? "" },
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load", description: e?.message ?? "Unknown error" });
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveDetails = async () => {
    if (!activeRow) return;

    const title = detailsForm.title.trim();
    const description = detailsForm.description.trim();

    if (!title) {
      toast({ variant: "destructive", title: "Missing title", description: "Title is required." });
      return;
    }
    if (!description) {
      toast({ variant: "destructive", title: "Missing description", description: "Description is required." });
      return;
    }
    if (!detailsForm.category.trim()) {
      toast({ variant: "destructive", title: "Missing category", description: "Category is required." });
      return;
    }
    if (!detailsForm.contentType.trim()) {
      toast({ variant: "destructive", title: "Missing type", description: "Type Content is required." });
      return;
    }

    setDetailsSaving(true);
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const [categoryId, contentTypeId] = await Promise.all([
        resolveCategoryId(detailsForm.category),
        resolveContentTypeId(detailsForm.contentType),
      ]);

      const scheduledAtIso = detailsForm.scheduledAt ? new Date(detailsForm.scheduledAt).toISOString() : null;

      const payload = {
        business_id: activeRow.businessId,
        category_id: categoryId,
        content_type_id: contentTypeId,
        title,
        description,
        platform: detailsForm.platform.trim() || null,
        scheduled_at: scheduledAtIso,
        image_primary_url: images.primary.url || null,
        image_second_url: images.second.url || null,
        image_third_url: images.third.url || null,
      };

      if (detailsItemId) {
        const { error } = await supabase.from("content_items").update(payload).eq("id", detailsItemId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("content_items")
          .insert({ ...payload, created_by: userId })
          .select("id")
          .single();
        if (error) throw error;
        setDetailsItemId(created.id);
      }

      toast({ title: "Saved", description: "Content item saved successfully." });
      // Keep dropdown lists in sync (UI-only)
      setCategories((prev) => uniqueNonEmpty([...prev, detailsForm.category.trim()]));
      setContentTypes((prev) => uniqueNonEmpty([...prev, detailsForm.contentType.trim()]));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" });
    } finally {
      setDetailsSaving(false);
    }
  };

  const openManage = (tab: "category" | "content") => {
    setManageTab(tab);
    setManageDialogOpen(true);
  };

  const refreshCategories = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("content_categories")
      .select("name, is_locked")
      .order("name", { ascending: true });
    if (error) throw error;

    const rows = (data ?? []) as Array<{ name: string; is_locked?: boolean }>;
    const names = rows.map((c) => (c as any).name as string);

    // Always keep "General" available in the UI
    setCategories(uniqueNonEmpty(["General", ...names]));
    setLockedCategories(new Set(rows.filter((c) => Boolean(c.is_locked)).map((c) => lockKey(c.name))));
  }, []);

  const refreshContentTypes = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("content_types")
      .select("name, is_locked")
      .order("name", { ascending: true });
    if (error) throw error;

    const rows = (data ?? []) as Array<{ name: string; is_locked?: boolean }>;
    const names = rows.map((t) => (t as any).name as string);

    setContentTypes(uniqueNonEmpty([...(DEFAULT_CONTENT_TYPES as unknown as string[]), ...names]));
    setLockedContentTypes(new Set(rows.filter((t) => Boolean(t.is_locked)).map((t) => lockKey(t.name))));
  }, []);

  const lookupCategoryIdInsensitive = async (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return null;

    const { data, error } = await supabase
      .from("content_categories")
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
      .from("content_types")
      .select("id")
      .ilike("name", cleaned)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
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

      const { error } = await supabase.from("content_categories").update({ name: to }).eq("id", id);
      if (error) throw error;

      // keep local fields synced (so the user sees the new name immediately)
      setDetailsForm((p) => (p.category === from ? { ...p, category: to } : p));
      setDetailsSortCategory((p) => (p === from ? to : p));

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

      const { error } = await supabase.from("content_categories").delete().eq("id", id);
      if (error) throw error;

      setLockedCategories((prev) => {
        const next = new Set(prev);
        next.delete(lockKey(name));
        return next;
      });
      setDetailsForm((p) => (p.category === name ? { ...p, category: "" } : p));
      setDetailsSortCategory((p) => (p === name ? "" : p));
      if (editingCategory === name) cancelEditCategory();

      await refreshCategories();
      toast({ title: "Deleted", description: "Category deleted." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e?.message ?? "Category may be in use by existing content items.",
      });
    }
  };

  const toggleCategoryLock = async (name: string) => {
    const generalKey = lockKey(name);
    if (generalKey === "general") {
      setLockedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(generalKey)) next.delete(generalKey);
        else next.add(generalKey);
        return next;
      });
      return;
    }

    try {
      const cleaned = name.trim();
      const { data, error } = await supabase
        .from("content_categories")
        .select("id, is_locked")
        .ilike("name", cleaned)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Category not found in database.");

      const nextLocked = !Boolean((data as any).is_locked);
      const { error: updateError } = await supabase
        .from("content_categories")
        .update({ is_locked: nextLocked })
        .eq("id", (data as any).id);
      if (updateError) throw updateError;

      await refreshCategories();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e?.message ?? "Failed to toggle lock." });
    }
  };

  const addContentType = async () => {
    const name = newContentType.trim();
    if (!name) return;
    if (contentTypes.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Column already exists", description: `Content \"${name}\" is already registered.` });
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

    if (contentTypes.some((c) => c !== from && c.toLowerCase() === to.toLowerCase())) {
      toast({ title: "Column name conflict", description: `Content \"${to}\" already exists.` });
      return;
    }

    try {
      const id = await lookupContentTypeIdInsensitive(from);
      if (!id) throw new Error("Type Content not found in database.");

      const { error } = await supabase.from("content_types").update({ name: to }).eq("id", id);
      if (error) throw error;

      setDetailsForm((p) => (p.contentType === from ? { ...p, contentType: to } : p));
      setDetailsSortTypeContent((p) => (p === from ? to : p));

      await refreshContentTypes();
      cancelEditContentType();
      toast({ title: "Saved", description: "Type Content updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" });
    }
  };

  const deleteContentType = async (name: string) => {
    try {
      const id = await lookupContentTypeIdInsensitive(name);
      if (!id) throw new Error("Type Content not found in database.");

      const { error } = await supabase.from("content_types").delete().eq("id", id);
      if (error) throw error;

      setLockedContentTypes((prev) => {
        const next = new Set(prev);
        next.delete(lockKey(name));
        return next;
      });
      setDetailsForm((p) => (p.contentType === name ? { ...p, contentType: "", platform: "" } : p));
      setDetailsSortTypeContent((p) => (p === name ? "" : p));
      if (editingContentType === name) cancelEditContentType();

      await refreshContentTypes();
      toast({ title: "Deleted", description: "Type Content deleted." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e?.message ?? "Type Content may be in use by existing content items.",
      });
    }
  };

  const toggleContentTypeLock = async (name: string) => {
    try {
      const cleaned = name.trim();
      const { data, error } = await supabase
        .from("content_types")
        .select("id, is_locked")
        .ilike("name", cleaned)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Type Content not found in database.");

      const nextLocked = !Boolean((data as any).is_locked);
      const { error: updateError } = await supabase
        .from("content_types")
        .update({ is_locked: nextLocked })
        .eq("id", (data as any).id);
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

  if (createOpen) {
    return (
      <ContentItemForm
        businesses={
          businesses.length
            ? businesses
            : [{ id: "demo", name: "Demo Business", publicId: "B00000" }]
        }
        categories={categories}
        contentTypes={contentTypes}
        onCancel={() => setCreateOpen(false)}
        onSave={(payload) => {
          toast({
            title: "Saved",
            description: `New content item saved (still placeholder). Business ID: ${payload.businessPublicId}`,
          });
          setCreateOpen(false);
        }}
      />
    );
  }

  if (detailsOpen && activeRow) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5"
              onClick={closeDetails}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">View Details</h1>
              <p className="text-muted-foreground">{activeRow.businessName}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={detailsSortCategory || "all"}
              onValueChange={(v) => {
                const next = v === "all" ? "" : v;
                setDetailsSortCategory(next);
                void fetchDetailsItem(next, detailsSortTypeContent);
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
              value={detailsSortTypeContent || "all"}
              onValueChange={(v) => {
                const next = v === "all" ? "" : v;
                setDetailsSortTypeContent(next);
                void fetchDetailsItem(detailsSortCategory, next);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Sort by Type Content" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Types</SelectItem>
                {contentTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_4fr]">
              {/* Images (≈20%) */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Images</h2>

                <ImageFieldCard
                  label="Primary Image"
                  value={images.primary.url}
                  originalValue={images.primary.originalUrl}
                  onChange={(next) => setImages((p) => ({ ...p, primary: next }))}
                  variant="compact"
                />

                <div className="grid gap-4">
                  <ImageFieldCard
                    label="Secondary Image"
                    value={images.second.url}
                    originalValue={images.second.originalUrl}
                    onChange={(next) => setImages((p) => ({ ...p, second: next }))}
                    variant="compact"
                  />
                  <ImageFieldCard
                    label="Third Image"
                    value={images.third.url}
                    originalValue={images.third.originalUrl}
                    onChange={(next) => setImages((p) => ({ ...p, third: next }))}
                    variant="compact"
                  />
                </div>
              </section>

              {/* Content Details (≈80%) */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Content Details</h2>

                {detailsLoading ? <p className="text-sm text-muted-foreground">Loading content...</p> : null}

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={detailsForm.title}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <RichTextEditor
                    value={detailsForm.description}
                    onChange={(v) => setDetailsForm((p) => ({ ...p, description: v }))}
                    onSave={() => void 0}
                    title="Description"
                    description=""
                    icon={Pencil}
                    showTopBar={false}
                    showSaveControls={false}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={detailsForm.category || undefined}
                      onValueChange={(v) => setDetailsForm((p) => ({ ...p, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Category" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type Content</Label>
                    <Select
                      value={detailsForm.contentType || undefined}
                      onValueChange={(v) => {
                        setDetailsForm((p) => ({
                          ...p,
                          contentType: v,
                          platform: "", // reset when changing type
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Type Content" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {contentTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <PlatformDropdown
                  contentType={detailsForm.contentType}
                  value={detailsForm.platform}
                  onChange={(next) => setDetailsForm((p) => ({ ...p, platform: next }))}
                />

                <div className="space-y-2">
                  <Label>Scheduled</Label>
                  <Input
                    type="datetime-local"
                    value={detailsForm.scheduledAt}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" onClick={() => void saveDetails()} disabled={detailsSaving || detailsLoading}>
                    {detailsSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Manage dialog (Category / Content) */}
        <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage</DialogTitle>
              <DialogDescription className="sr-only">Manage categories and content columns.</DialogDescription>
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
                    placeholder="Content column name..."
                  />
                  <Button type="button" onClick={addContentType}>
                    Add
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content Column</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentTypes.map((t) => {
                      const isEditing = editingContentType === t;
                      const isLocked = lockedContentTypes.has(lockKey(t));

                      return (
                        <TableRow key={t}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingContentTypeDraft}
                                onChange={(e) => setEditingContentTypeDraft(e.target.value)}
                              />
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
                                disabled={isEditing}
                                onClick={() => toggleContentTypeLock(t)}
                                aria-label={isLocked ? "Unlock" : "Lock"}
                                title={isLocked ? "Unlock" : "Lock"}
                              >
                                {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
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
                          No content columns yet.
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Content Creation</h1>
          <p className="text-muted-foreground">Manage content ideas, categories, and deliverables for clients.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary">
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 w-64">
              {contentTypes.map((t) => (
                <DropdownMenuItem key={t} onClick={() => onImport(t)}>
                  {t}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => openManage("content")}>
                Manage…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Content Management</CardTitle>
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
                  {contentTypes.map((t) => (
                    <TableHead key={t} className="text-right">
                      {t}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.businessName}</TableCell>
                    <TableCell className="font-medium">{row.category}</TableCell>
                    {contentTypes.map((t) => (
                      <TableCell key={t} className="text-right">
                        {row.counts?.[t] ?? 0}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openDetails(row)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {displayedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={contentTypes.length + 3} className="py-10 text-center text-muted-foreground">
                      No data for the selected business.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* Manage dialog (Category / Content) */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage</DialogTitle>
            <DialogDescription className="sr-only">Manage categories and content columns.</DialogDescription>
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
                  placeholder="Content column name..."
                />
                <Button type="button" onClick={addContentType}>
                  Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content Column</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentTypes.map((t) => {
                    const isEditing = editingContentType === t;
                    const isLocked = lockedContentTypes.has(lockKey(t));

                    return (
                      <TableRow key={t}>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editingContentTypeDraft}
                              onChange={(e) => setEditingContentTypeDraft(e.target.value)}
                            />
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
                              disabled={isEditing}
                              onClick={() => toggleContentTypeLock(t)}
                              aria-label={isLocked ? "Unlock" : "Lock"}
                              title={isLocked ? "Unlock" : "Lock"}
                            >
                              {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
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
                        No content columns yet.
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
