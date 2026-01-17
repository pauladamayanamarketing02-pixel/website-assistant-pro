import * as React from "react";

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

type SortDirection = "asc" | "desc";

type BusinessOption = {
  id: string;
  name: string;
};

type ContentRow = {
  id: string;
  businessId: string;
  businessName: string;
  category: string;
  socialMediaPosts: number;
  contentMediaPosts: number;
  gmbPosts: number;
  emailMarketing: number;
  adsMarketing: number;
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
    socialMediaPosts: 12,
    contentMediaPosts: 6,
    gmbPosts: 4,
    emailMarketing: 3,
    adsMarketing: 2,
  },
  {
    id: "demo-2",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Edukasi",
    socialMediaPosts: 18,
    contentMediaPosts: 10,
    gmbPosts: 5,
    emailMarketing: 6,
    adsMarketing: 1,
  },
  {
    id: "demo-3",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Testimoni",
    socialMediaPosts: 7,
    contentMediaPosts: 3,
    gmbPosts: 2,
    emailMarketing: 1,
    adsMarketing: 0,
  },
];

function safeName(name: string | null | undefined) {
  return (name ?? "(Tanpa Nama)").trim() || "(Tanpa Nama)";
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

  // Category + Content Type management (UI only for now)
  const [contentTypes, setContentTypes] = React.useState<string[]>(Array.from(DEFAULT_CONTENT_TYPES));
  const [categories, setCategories] = React.useState<string[]>(
    uniqueNonEmpty(["General", ...FALLBACK_ROWS.map((r) => r.category)]),
  );

  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);
  const [contentTypeDialogOpen, setContentTypeDialogOpen] = React.useState(false);

  const [newCategory, setNewCategory] = React.useState("");
  const [renameCategoryFrom, setRenameCategoryFrom] = React.useState<string>("");
  const [renameCategoryTo, setRenameCategoryTo] = React.useState("");

  const [newContentType, setNewContentType] = React.useState("");
  const [renameContentTypeFrom, setRenameContentTypeFrom] = React.useState<string>("");
  const [renameContentTypeTo, setRenameContentTypeTo] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const loadBusinesses = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name")
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
      }));

      setBusinesses(list);
    };

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows: ContentRow[] = React.useMemo(() => {
    // Placeholder sampai data real dibuat: buat 1 baris per bisnis
    if (businesses.length > 0) {
      return businesses.map((b) => ({
        id: `${b.id}-general`,
        businessId: b.id,
        businessName: b.name,
        category: "General",
        socialMediaPosts: 0,
        contentMediaPosts: 0,
        gmbPosts: 0,
        emailMarketing: 0,
        adsMarketing: 0,
      }));
    }

    return FALLBACK_ROWS;
  }, [businesses]);

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
      title: "Import dipilih",
      description: `Anda memilih import: ${type}`,
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
      title: "Tersimpan",
      description: "Perubahan disimpan (sementara masih placeholder).",
    });
    closeDetails();
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Kategori sudah ada",
        description: `Kategori \"${name}\" sudah terdaftar.`,
      });
      return;
    }
    setCategories((p) => [...p, name]);
    setNewCategory("");
  };

  const renameCategory = () => {
    const from = renameCategoryFrom.trim();
    const to = renameCategoryTo.trim();
    if (!from || !to) return;

    if (categories.some((c) => c.toLowerCase() === to.toLowerCase())) {
      toast({
        title: "Nama kategori bentrok",
        description: `Kategori \"${to}\" sudah ada.`,
      });
      return;
    }

    setCategories((p) => p.map((c) => (c === from ? to : c)));

    // jika form detail sedang memakai category yang di-rename
    setDetailsForm((p) => (p.category === from ? { ...p, category: to } : p));

    setRenameCategoryFrom("");
    setRenameCategoryTo("");
  };

  const addContentType = () => {
    const name = newContentType.trim();
    if (!name) return;
    if (contentTypes.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Jenis konten sudah ada",
        description: `Jenis konten \"${name}\" sudah terdaftar.`,
      });
      return;
    }
    setContentTypes((p) => [...p, name]);
    setNewContentType("");
  };

  const renameContentType = () => {
    const from = renameContentTypeFrom.trim();
    const to = renameContentTypeTo.trim();
    if (!from || !to) return;

    if (contentTypes.some((c) => c.toLowerCase() === to.toLowerCase())) {
      toast({
        title: "Nama jenis konten bentrok",
        description: `Jenis konten \"${to}\" sudah ada.`,
      });
      return;
    }

    setContentTypes((p) => p.map((c) => (c === from ? to : c)));
    setRenameContentTypeFrom("");
    setRenameContentTypeTo("");
  };

  if (detailsOpen && activeRow) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">View Details</h1>
            <p className="text-muted-foreground">{activeRow.businessName} • {activeRow.category}</p>
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

        {/* Desktop/table layout */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[42%]">Images</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[30%]">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="align-top">
                <TableCell className="p-4">
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
                </TableCell>

                <TableCell className="p-4">
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
                          placeholder="Judul konten..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={detailsForm.description}
                          onChange={(e) => setDetailsForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Deskripsi..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Comments</Label>
                        <Textarea
                          value={detailsForm.comments}
                          onChange={(e) => setDetailsForm((p) => ({ ...p, comments: e.target.value }))}
                          placeholder="Catatan / komentar..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TableCell>

                <TableCell className="p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
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
                          <Select value={detailsForm.category || ""} onValueChange={(v) => setDetailsForm((p) => ({ ...p, category: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="secondary" onClick={() => setCategoryDialogOpen(true)}>
                            Manage Category
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Mobile layout */}
        <div className="grid gap-6 md:hidden">
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
                    placeholder="Judul konten..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={detailsForm.description}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Deskripsi..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    value={detailsForm.comments}
                    onChange={(e) => setDetailsForm((p) => ({ ...p, comments: e.target.value }))}
                    placeholder="Catatan / komentar..."
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
                    <Select value={detailsForm.category || ""} onValueChange={(v) => setDetailsForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
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
                      <Button type="button" variant="secondary" onClick={() => setCategoryDialogOpen(true)}>
                        Manage Category
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Manage Category dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Manage Category</DialogTitle>
              <DialogDescription>Tambah atau ubah nama category (sementara hanya UI).</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Add new category</h3>
                <div className="flex gap-2">
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nama category..." />
                  <Button type="button" onClick={addCategory}>
                    Add
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Rename category</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={renameCategoryFrom} onValueChange={setRenameCategoryFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih category" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={renameCategoryTo}
                    onChange={(e) => setRenameCategoryTo(e.target.value)}
                    placeholder="Nama baru..."
                  />
                </div>
                <Button type="button" variant="secondary" onClick={renameCategory}>
                  Rename
                </Button>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Current categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span key={c} className="rounded-md border px-2 py-1 text-sm text-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
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
          <p className="text-muted-foreground">Kelola ide, kategori, dan konten untuk klien.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button">Upload</Button>

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
              <DropdownMenuItem
                onClick={() => {
                  setContentTypeDialogOpen(true);
                }}
              >
                Manage content types…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Manajemen Content</CardTitle>
            {lastImportType ? (
              <p className="text-sm text-muted-foreground">Terakhir dipilih: {lastImportType}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Sortir berdasarkan nama bisnis" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">Semua Bisnis</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
            >
              Sort Nama: {sortDirection === "asc" ? "A–Z" : "Z–A"}
            </Button>

            <Button type="button" variant="secondary" onClick={() => setCategoryDialogOpen(true)}>
              Manage Category
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Social Media Posts</TableHead>
                <TableHead className="text-right">Content Media Posts</TableHead>
                <TableHead className="text-right">GMB Posts</TableHead>
                <TableHead className="text-right">Email Marketing</TableHead>
                <TableHead className="text-right">Ads Marketing</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {displayedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.businessName}</TableCell>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell className="text-right">{row.socialMediaPosts}</TableCell>
                  <TableCell className="text-right">{row.contentMediaPosts}</TableCell>
                  <TableCell className="text-right">{row.gmbPosts}</TableCell>
                  <TableCell className="text-right">{row.emailMarketing}</TableCell>
                  <TableCell className="text-right">{row.adsMarketing}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => openDetails(row)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Tidak ada data untuk bisnis yang dipilih.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Category dialog (list page) */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage Category</DialogTitle>
            <DialogDescription>Tambah atau ubah nama category (sementara hanya UI).</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Add new category</h3>
              <div className="flex gap-2">
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nama category..." />
                <Button type="button" onClick={addCategory}>
                  Add
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Rename category</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={renameCategoryFrom} onValueChange={setRenameCategoryFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih category" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={renameCategoryTo} onChange={(e) => setRenameCategoryTo(e.target.value)} placeholder="Nama baru..." />
              </div>
              <Button type="button" variant="secondary" onClick={renameCategory}>
                Rename
              </Button>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Current categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c} className="rounded-md border px-2 py-1 text-sm text-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Content Types dialog */}
      <Dialog open={contentTypeDialogOpen} onOpenChange={setContentTypeDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage Content Types</DialogTitle>
            <DialogDescription>Tambah atau ubah nama jenis content untuk menu Import (sementara hanya UI).</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Add new type</h3>
              <div className="flex gap-2">
                <Input value={newContentType} onChange={(e) => setNewContentType(e.target.value)} placeholder="Nama jenis content..." />
                <Button type="button" onClick={addContentType}>
                  Add
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Rename type</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={renameContentTypeFrom} onValueChange={setRenameContentTypeFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis content" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {contentTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={renameContentTypeTo}
                  onChange={(e) => setRenameContentTypeTo(e.target.value)}
                  placeholder="Nama baru..."
                />
              </div>
              <Button type="button" variant="secondary" onClick={renameContentType}>
                Rename
              </Button>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Current types</h3>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((t) => (
                  <span key={t} className="rounded-md border px-2 py-1 text-sm text-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContentTypeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
