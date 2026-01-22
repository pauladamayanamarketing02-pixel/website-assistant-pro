import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Plus, RefreshCcw, Save, Trash2, Upload, X } from "lucide-react";

type TemplateRow = {
  id: string;
  name: string;
  category: string;
  is_active?: boolean;
  sort_order?: number;
  // URL gambar thumbnail
  preview_image_url?: string;
  // URL demo (dibuka di tab baru)
  preview_url?: string;
};

const SETTINGS_TEMPLATES_KEY = "order_templates";
const SETTINGS_TEMPLATE_CATEGORIES_KEY = "order_template_categories";

function asNumber(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isLikelyImageUrl(url: string): boolean {
  const u = (url ?? "").trim().toLowerCase();
  if (!u) return false;
  if (u.includes("/template-previews/")) return true;
  return /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(u);
}

export default function WebsiteDomainTools() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);

  const [templateCategories, setTemplateCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [uploadingTemplate, setUploadingTemplate] = useState<Record<string, boolean>>({});

  const [templateQuery, setTemplateQuery] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all");
  const [templatePage, setTemplatePage] = useState(1);
  const TEMPLATE_PAGE_SIZE = 20;

  const [categoryQuery, setCategoryQuery] = useState("");
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; src?: string; title?: string }>({ open: false });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [{ data: tplRow }, { data: catsRow }] = await Promise.all([
        (supabase as any).from("website_settings").select("value").eq("key", SETTINGS_TEMPLATES_KEY).maybeSingle(),
        (supabase as any)
          .from("website_settings")
          .select("value")
          .eq("key", SETTINGS_TEMPLATE_CATEGORIES_KEY)
          .maybeSingle(),
      ]);

      const rawTemplates = Array.isArray(tplRow?.value) ? (tplRow.value as any[]) : [];
      // Backward-compat: dulu `preview_url` dipakai untuk gambar.
      // Sekarang gambar -> `preview_image_url`, demo URL -> `preview_url`.
      const nextTemplates: TemplateRow[] = rawTemplates.map((t: any) => {
        const legacyPreview = String(t?.preview_url ?? "").trim();
        const explicitImg = String(t?.preview_image_url ?? "").trim();
        const preview_image_url = explicitImg || (isLikelyImageUrl(legacyPreview) ? legacyPreview : "");
        const preview_url = !isLikelyImageUrl(legacyPreview) ? legacyPreview : "";
        return {
          ...t,
          preview_image_url: preview_image_url || undefined,
          preview_url: preview_url || undefined,
        };
      });
      setTemplates(nextTemplates);
      const nextCategories = Array.isArray(catsRow?.value) ? (catsRow.value as any[]).map((v) => String(v ?? "").trim()).filter(Boolean) : [];
      setTemplateCategories(Array.from(new Set(nextCategories)).sort((a, b) => a.localeCompare(b)));
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Gagal memuat Templates";
      if (String(msg).toLowerCase().includes("unauthorized")) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of templates) {
      const c = String(t.category ?? "").trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }

    const fromDb = (templateCategories ?? []).map((name) => ({ name, count: counts.get(name) ?? 0 }));
    // include any categories used by templates but missing in DB
    const extras = Array.from(counts.entries())
      .filter(([name]) => !fromDb.some((c) => c.name === name))
      .map(([name, count]) => ({ name, count }));
    return [...fromDb, ...extras].sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, templateCategories]);

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categoryQuery]);

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    return (templates ?? []).filter((t) => {
      const byQuery = !q ? true : String(t.name ?? "").toLowerCase().includes(q);
      const byCategory = templateCategoryFilter === "all" ? true : String(t.category ?? "").trim() === templateCategoryFilter;
      return byQuery && byCategory;
    });
  }, [templateCategoryFilter, templateQuery, templates]);

  const totalTemplatePages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTemplates.length / TEMPLATE_PAGE_SIZE));
  }, [filteredTemplates.length]);

  useEffect(() => {
    setTemplatePage(1);
  }, [templateQuery, templateCategoryFilter]);

  const pagedTemplates = useMemo(() => {
    const start = (templatePage - 1) * TEMPLATE_PAGE_SIZE;
    return filteredTemplates.slice(start, start + TEMPLATE_PAGE_SIZE);
  }, [filteredTemplates, templatePage]);

  const saveCategoriesOnly = async (nextCategories: string[]) => {
    try {
      const categoriesPayload = Array.from(
        new Set(
          (nextCategories ?? [])
            .map((c) => String(c ?? "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));

      const { error } = await (supabase as any)
        .from("website_settings")
        .upsert({ key: SETTINGS_TEMPLATE_CATEGORIES_KEY, value: categoriesPayload }, { onConflict: "key" });
      if (error) throw error;
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Gagal simpan category",
        description: e?.message ?? "Unknown error",
      });
    }
  };

  const renameCategory = (from: string, to: string) => {
    const next = String(to ?? "").trim();
    if (!next) return;
    setTemplates((prev) => prev.map((t) => (String(t.category ?? "").trim() === from ? { ...t, category: next } : t)));
    setTemplateCategories((prev) => {
      const updated = prev.map((c) => (c === from ? next : c));
      const deduped = Array.from(new Set(updated.map((c) => String(c).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      void saveCategoriesOnly(deduped);
      return deduped;
    });
  };

  const deleteCategory = (name: string) => {
    const used = templates.some((t) => String(t.category ?? "").trim() === name);
    if (used) {
      toast({
        variant: "destructive",
        title: "Tidak bisa hapus category",
        description: "Category ini masih dipakai oleh template. Pindahkan category template dulu, lalu coba lagi.",
      });
      return;
    }
    setTemplateCategories((prev) => {
      const next = prev.filter((c) => c !== name);
      void saveCategoriesOnly(next);
      return next;
    });
    toast({ title: "Deleted", description: "Category dihapus." });
  };

  const handleUploadImage = async (templateId: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Error", description: "File harus berupa gambar." });
      return;
    }

    setUploadingTemplate((prev) => ({ ...prev, [templateId]: true }));
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const filename = `${templateId}-${Date.now()}.${ext}`;
      const { data, error } = await (supabase as any).storage.from("template-previews").upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;

      const { data: urlData } = (supabase as any).storage.from("template-previews").getPublicUrl(data.path);
      const publicUrl = urlData?.publicUrl ?? "";

      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, preview_image_url: publicUrl } : t)));
      toast({ title: "Uploaded", description: "Gambar berhasil diupload." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Upload failed", description: e?.message ?? "Unknown error" });
    } finally {
      setUploadingTemplate((prev) => ({ ...prev, [templateId]: false }));
    }
  };

  const handleRemoveImage = async (templateId: string, currentUrl: string) => {
    const url = String(currentUrl ?? "").trim();
    if (!url) return;

    setUploadingTemplate((prev) => ({ ...prev, [templateId]: true }));
    try {
      // Extract file path from public URL
      const match = url.match(/template-previews\/(.+)/);
      if (match?.[1]) {
        const { error } = await (supabase as any).storage.from("template-previews").remove([match[1]]);
        if (error) console.warn("Failed to delete file from storage:", error);
      }

      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, preview_image_url: "" } : t)));
      toast({ title: "Removed", description: "Gambar dihapus." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Remove failed", description: e?.message ?? "Unknown error" });
    } finally {
      setUploadingTemplate((prev) => ({ ...prev, [templateId]: false }));
    }
  };

  const saveTemplates = async () => {
    setSaving(true);
    try {
      const payload = templates
        .map((t) => ({
          id: String(t.id ?? "").trim(),
          name: String(t.name ?? "").trim(),
          category: t.category,
          is_active: t.is_active !== false,
          sort_order: typeof t.sort_order === "number" ? t.sort_order : Number(t.sort_order ?? 0),
          preview_image_url: String((t as any)?.preview_image_url ?? "").trim() || undefined,
          preview_url: String((t as any)?.preview_url ?? "").trim() || undefined,
        }))
        .filter((t) => t.id && t.name);

      const { error } = await (supabase as any)
        .from("website_settings")
        .upsert({ key: SETTINGS_TEMPLATES_KEY, value: payload }, { onConflict: "key" });
      if (error) throw error;

      const categoriesPayload = Array.from(
        new Set(
          (templateCategories ?? [])
            .map((c) => String(c ?? "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));
      const { error: catErr } = await (supabase as any)
        .from("website_settings")
        .upsert({ key: SETTINGS_TEMPLATE_CATEGORIES_KEY, value: categoriesPayload }, { onConflict: "key" });
      if (catErr) throw catErr;

      toast({ title: "Saved", description: "Templates updated." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to save", description: e?.message ?? "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  const templateCountLabel = useMemo(() => String(templates.length), [templates.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-foreground">Templates (Order)</h1>
          <p className="text-muted-foreground">Kelola templates yang tampil di halaman /order/choose-design.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={fetchTemplates} disabled={loading || saving}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
          </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Order Templates</CardTitle>
                  <CardDescription>Daftar template yang tampil di /order/choose-design.</CardDescription>
                </div>
                <Badge variant="outline">Total: {templateCountLabel}</Badge>
              </div>

              <div className="grid gap-2 md:grid-cols-6">
                <div className="md:col-span-4">
                  <Label className="text-xs">Search template</Label>
                  <Input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)} placeholder="Cari nama template..." />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Filter category</Label>
                  <Select value={templateCategoryFilter} onValueChange={setTemplateCategoryFilter}>
                    <SelectTrigger disabled={saving}>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {(categories.length ? categories : [{ name: "business", count: 0 }]).map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  Menampilkan {filteredTemplates.length} template • Page {templatePage} / {totalTemplatePages}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplatePage((p) => Math.max(1, p - 1))}
                    disabled={templatePage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplatePage((p) => Math.min(totalTemplatePages, p + 1))}
                    disabled={templatePage >= totalTemplatePages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}

              {/* Templates table */}
              <div className="space-y-3">
                  {!loading && pagedTemplates.length ? (
                    <div className="rounded-md border bg-muted/20">
                      <div className="max-h-[70vh] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-[84px]">Preview</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="w-[260px]">Url Preview</TableHead>
                              <TableHead className="w-[220px]">Category</TableHead>
                              <TableHead className="w-[120px]">Sort</TableHead>
                              <TableHead className="w-[160px]">Status</TableHead>
                              <TableHead className="w-[210px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagedTemplates.map((t) => {
                              const idx = templates.findIndex((x) => x.id === t.id);
                              const previewSrc = String((t as any)?.preview_image_url ?? "").trim();
                              const demoUrl = String((t as any)?.preview_url ?? "").trim();

                              return (
                                <TableRow key={t.id}>
                                  <TableCell>
                                    {previewSrc ? (
                                      <button
                                        type="button"
                                        className="block"
                                        onClick={() => setPreviewDialog({ open: true, src: previewSrc, title: t.name })}
                                        title="Klik untuk preview"
                                      >
                                        <img
                                          src={previewSrc}
                                          alt={`Preview ${t.name}`}
                                          className="h-12 w-16 rounded border object-cover"
                                          loading="lazy"
                                        />
                                      </button>
                                    ) : (
                                      <div className="h-12 w-16 rounded border bg-background" />
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <Input
                                      value={t.name}
                                      onChange={(e) =>
                                        setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                                      }
                                      disabled={saving}
                                    />
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={demoUrl}
                                        onChange={(e) =>
                                          setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, preview_url: e.target.value } : x)))
                                        }
                                        placeholder="https://demo..."
                                        disabled={saving}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                          const url = String((t as any)?.preview_url ?? "").trim();
                                          if (!url) return;
                                          window.open(url, "_blank", "noopener,noreferrer");
                                        }}
                                        disabled={!demoUrl}
                                        aria-label="Open preview url"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <Select
                                      value={String(t.category ?? "").trim() || "uncategorized"}
                                      onValueChange={(v) =>
                                        setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, category: v as any } : x)))
                                      }
                                    >
                                      <SelectTrigger disabled={saving}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(categories.length ? categories : [{ name: "business", count: 0 }]).map((c) => (
                                          <SelectItem key={c.name} value={c.name}>
                                            {c.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>

                                  <TableCell>
                                    <Input
                                      value={String(t.sort_order ?? 0)}
                                      onChange={(e) =>
                                        setTemplates((prev) =>
                                          prev.map((x, i) => (i === idx ? { ...x, sort_order: Number(e.target.value) } : x)),
                                        )
                                      }
                                      inputMode="numeric"
                                      disabled={saving}
                                    />
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={t.is_active === false ? "secondary" : "default"}>
                                        {t.is_active === false ? "Off" : "On"}
                                      </Badge>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setTemplates((prev) =>
                                            prev.map((x, i) => (i === idx ? { ...x, is_active: x.is_active === false } : x)),
                                          )
                                        }
                                        disabled={saving}
                                      >
                                        Toggle
                                      </Button>
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <label className="cursor-pointer">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleUploadImage(t.id, e.target.files?.[0] ?? null)}
                                          disabled={saving || uploadingTemplate[t.id]}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={saving || uploadingTemplate[t.id]}
                                          asChild
                                        >
                                          <span>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {uploadingTemplate[t.id] ? "Uploading..." : "Upload"}
                                          </span>
                                        </Button>
                                      </label>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveImage(t.id, previewSrc)}
                                        disabled={saving || uploadingTemplate[t.id] || !previewSrc}
                                      >
                                        <X className="h-4 w-4 mr-2" /> Remove
                                      </Button>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setTemplates((prev) => prev.filter((_, i) => i !== idx))}
                                        disabled={saving}
                                        aria-label="Remove template"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : !loading ? (
                    <div className="text-sm text-muted-foreground">Belum ada template. Klik “Add Template”.</div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setTemplates((prev) => [
                          ...prev,
                          { id: `t${Date.now()}`, name: "New Template", category: "business", is_active: true, sort_order: prev.length + 1 },
                        ])
                      }
                      disabled={saving}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Template
                    </Button>
                    <Button type="button" onClick={saveTemplates} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" /> Simpan Templates
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Template Categories</CardTitle>
              <CardDescription>Kelola daftar category untuk Templates (Order).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Template Categories</p>
                    <p className="text-xs text-muted-foreground">Tambah, rename, dan hapus category.</p>
                  </div>
                  <Badge variant="outline">{categories.length}</Badge>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <Label className="text-xs">Cari category</Label>
                    <Input
                      value={categoryQuery}
                      onChange={(e) => setCategoryQuery(e.target.value)}
                      placeholder="Cari category..."
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">New category</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="contoh: ecommerce"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const next = newCategory.trim();
                          if (!next) return;
                          const exists = (templateCategories ?? []).some((c) => c === next);
                          if (exists) {
                            toast({ variant: "destructive", title: "Category sudah ada", description: "Gunakan nama lain." });
                            return;
                          }
                          setTemplateCategories((prev) => {
                            const deduped = Array.from(new Set([...prev, next])).sort((a, b) => a.localeCompare(b));
                            void saveCategoriesOnly(deduped);
                            return deduped;
                          });
                          setNewCategory("");
                        }}
                        disabled={saving}
                        aria-label="Add Category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[520px] pr-2">
                    <div className="space-y-2">
                      {(filteredCategories.length ? filteredCategories : []).map((c) => (
                        <div key={c.name} className="rounded-md border bg-background p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                              <div className="text-xs text-muted-foreground">Used: {c.count}</div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => deleteCategory(c.name)}
                              disabled={saving}
                              aria-label="Delete category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-2">
                            <Label className="text-xs">Rename</Label>
                            <Input
                              defaultValue={c.name}
                              onBlur={(e) => {
                                const next = e.target.value.trim();
                                if (!next || next === c.name) return;
                                renameCategory(c.name, next);
                              }}
                              disabled={saving}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog((p) => ({ ...p, open }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDialog.title || "Preview"}</DialogTitle>
          </DialogHeader>
          {previewDialog.src ? (
            <img
              src={previewDialog.src}
              alt={previewDialog.title ? `Preview ${previewDialog.title}` : "Preview"}
              className="w-full rounded-md border object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
