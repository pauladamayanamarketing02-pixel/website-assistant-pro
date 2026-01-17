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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageFieldCard from "@/components/dashboard/ImageFieldCard";
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
    category: "Promo",
    counts: {
      "Social Media Posts": 12,
      "Content Media Posts": 6,
      "GMB Posts": 4,
      "Email Marketing": 3,
      "Ads Marketing": 2,
    },
  },
  {
    id: "demo-2",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Edukasi",
    counts: {
      "Social Media Posts": 18,
      "Content Media Posts": 10,
      "GMB Posts": 5,
      "Email Marketing": 6,
      "Ads Marketing": 1,
    },
  },
  {
    id: "demo-3",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Testimoni",
    counts: {
      "Social Media Posts": 7,
      "Content Media Posts": 3,
      "GMB Posts": 2,
      "Email Marketing": 1,
      "Ads Marketing": 0,
    },
  },
];

function safeName(name: string | null | undefined) {
  return (name ?? "(No name)").trim() || "(No name)";
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

  const [detailsForm, setDetailsForm] = React.useState({
    title: "",
    description: "",
    comments: "",
    dateSuggest: "",
    category: "",
  });

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
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, business_number")
        .order("business_name", { ascending: true, nullsFirst: false });

      if (cancelled) return;

      if (error) {
        // Jangan blok UI — fallback ke data demo
        setBusinesses([]);
        return;
      }

      const list: BusinessOption[] = (data ?? []).map((b) => ({
        id: b.id,
        name: safeName(b.business_name),
        publicId: formatBusinessId((b as any).business_number as number | null),
      }));

      setBusinesses(list);
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
    setDetailsForm({
      title: "",
      description: "",
      comments: "",
      dateSuggest: new Date().toISOString().slice(0, 10),
      category: row.category,
    });
    setImages({
      primary: { url: "/placeholder.svg", originalUrl: "/placeholder.svg" },
      second: { url: "/placeholder.svg", originalUrl: "/placeholder.svg" },
      third: { url: "/placeholder.svg", originalUrl: "/placeholder.svg" },
    });
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setActiveRow(null);
  };

  const saveDetails = () => {
    toast({
      title: "Saved",
      description: "Changes saved (still placeholder).",
    });
    closeDetails();
  };

  const openManage = (tab: "category" | "content") => {
    setManageTab(tab);
    setManageDialogOpen(true);
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Category already exists", description: `Category "${name}" is already registered.` });
      return;
    }
    setCategories((p) => [...p, name]);
    setNewCategory("");
  };

  const startEditCategory = (name: string) => {
    setEditingCategory(name);
    setEditingCategoryDraft(name);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryDraft("");
  };

  const saveEditCategory = () => {
    const from = (editingCategory ?? "").trim();
    const to = editingCategoryDraft.trim();
    if (!from || !to) return;

    if (categories.some((c) => c !== from && c.toLowerCase() === to.toLowerCase())) {
      toast({ title: "Category name conflict", description: `Category "${to}" already exists.` });
      return;
    }

    setCategories((p) => p.map((c) => (c === from ? to : c)));
    setDetailsForm((p) => (p.category === from ? { ...p, category: to } : p));

    cancelEditCategory();
  };

  const deleteCategory = (name: string) => {
    setCategories((p) => p.filter((c) => c !== name));
    setLockedCategories((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    setDetailsForm((p) => (p.category === name ? { ...p, category: "" } : p));
    if (editingCategory === name) cancelEditCategory();
  };

  const toggleCategoryLock = (name: string) => {
    setLockedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addContentType = () => {
    const name = newContentType.trim();
    if (!name) return;
    if (contentTypes.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Column already exists", description: `Content "${name}" is already registered.` });
      return;
    }
    setContentTypes((p) => [...p, name]);
    setNewContentType("");
  };

  const startEditContentType = (name: string) => {
    setEditingContentType(name);
    setEditingContentTypeDraft(name);
  };

  const cancelEditContentType = () => {
    setEditingContentType(null);
    setEditingContentTypeDraft("");
  };

  const saveEditContentType = () => {
    const from = (editingContentType ?? "").trim();
    const to = editingContentTypeDraft.trim();
    if (!from || !to) return;

    if (contentTypes.some((c) => c !== from && c.toLowerCase() === to.toLowerCase())) {
      toast({ title: "Column name conflict", description: `Content "${to}" already exists.` });
      return;
    }

    setContentTypes((p) => p.map((c) => (c === from ? to : c)));
    cancelEditContentType();
  };

  const deleteContentType = (name: string) => {
    setContentTypes((p) => p.filter((t) => t !== name));
    setLockedContentTypes((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    if (editingContentType === name) cancelEditContentType();
  };

  const toggleContentTypeLock = (name: string) => {
    setLockedContentTypes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
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

  const handleConfirm = () => {
    if (!confirmAction) return;

    switch (confirmAction.kind) {
      case "delete_category":
        deleteCategory(confirmAction.name);
        break;
      case "save_edit_category":
        saveEditCategory();
        break;
      case "delete_type":
        deleteContentType(confirmAction.name);
        break;
      case "save_edit_type":
        saveEditContentType();
        break;
    }

    setConfirmAction(null);
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
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">View Details</h1>
            <p className="text-muted-foreground">
              {activeRow.businessName} • {activeRow.category}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={closeDetails}>
              Back
            </Button>
            <Button type="button" onClick={saveDetails}>
              Save
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Images</h2>
            <div className="space-y-3">
              <ImageFieldCard
                label="Primary"
                value={images.primary.url}
                originalValue={images.primary.originalUrl}
                onChange={(next) => setImages((p) => ({ ...p, primary: next }))}
              />
              <ImageFieldCard
                label="Second"
                value={images.second.url}
                originalValue={images.second.originalUrl}
                onChange={(next) => setImages((p) => ({ ...p, second: next }))}
              />
              <ImageFieldCard
                label="Third"
                value={images.third.url}
                originalValue={images.third.originalUrl}
                onChange={(next) => setImages((p) => ({ ...p, third: next }))}
              />
            </div>
          </section>

          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={detailsForm.title}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Content title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={detailsForm.description}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    value={detailsForm.comments}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, comments: e.target.value }))}
                    placeholder="Notes / comments..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date Suggest</Label>
                    <Input
                      type="date"
                      value={detailsForm.dateSuggest}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, dateSuggest: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={detailsForm.category || ""}
                      onValueChange={(v) => setDetailsForm((p) => ({ ...p, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => openManage("category")}>
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

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
                      const isLocked = lockedCategories.has(c);

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
                      const isLocked = lockedContentTypes.has(t);

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
                    const isLocked = lockedCategories.has(c);

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
                    const isLocked = lockedContentTypes.has(t);

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
