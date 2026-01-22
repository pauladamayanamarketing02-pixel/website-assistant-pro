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
import { Plus, RefreshCcw, Save, Trash2, Upload, X } from "lucide-react";

type TemplateRow = {
  id: string;
  name: string;
  category: string;
  is_active?: boolean;
  sort_order?: number;
  preview_url?: string;
};

type PackageOption = {
  id: string;
  name: string;
};

type TldPriceRow = {
  tld: string;
  price_usd: number;
};

type PlanRow = {
  years: number;
  label: string;
  price_usd: number;
  is_active: boolean;
  sort_order: number;
};

const SETTINGS_TEMPLATES_KEY = "order_templates";
const SETTINGS_TEMPLATE_CATEGORIES_KEY = "order_template_categories";
const SETTINGS_SUBSCRIPTION_PLANS_KEY = "order_subscription_plans";

function normalizeTld(input: unknown): string {
  return String(input ?? "").trim().toLowerCase().replace(/^\./, "");
}

function safeNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asNumber(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
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

  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  // Keep default_package_id as internal context for pricing edge function (no UI)
  const [pricingPackageId, setPricingPackageId] = useState<string>("");
  const [tldPrices, setTldPrices] = useState<TldPriceRow[]>([]);

  const [plansLoading, setPlansLoading] = useState(true);
  const [plansSaving, setPlansSaving] = useState(false);
  const [plans, setPlans] = useState<PlanRow[]>([]);

  const defaultTldRows: TldPriceRow[] = useMemo(
    () => ["com", "net", "org", "id"].map((tld) => ({ tld, price_usd: 0 })),
    [],
  );

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

      const nextTemplates = Array.isArray(tplRow?.value) ? (tplRow.value as any) : [];
      setTemplates(nextTemplates);
      const nextCategories = Array.isArray(catsRow?.value) ? (catsRow.value as any[]).map((v) => String(v ?? "").trim()).filter(Boolean) : [];
      setTemplateCategories(Array.from(new Set(nextCategories)).sort((a, b) => a.localeCompare(b)));
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Gagal memuat Domain Tools";
      if (String(msg).toLowerCase().includes("unauthorized")) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainPricing = async () => {
    setPricingLoading(true);
    try {
      const [{ data: pkgRows, error: pkgErr }, pricingRes] = await Promise.all([
        // Only used as fallback if backend has no default_package_id
        (supabase as any).from("packages").select("id,name").order("name"),
        (supabase as any).functions.invoke("admin-order-domain-pricing", { body: { action: "get" } }),
      ]);
      if (pkgErr) throw pkgErr;

      const pkgOptions = Array.isArray(pkgRows) ? (pkgRows as any).map((p: any) => ({ id: p.id, name: p.name })) : [];
      setPackages(pkgOptions);

      const payload = (pricingRes as any)?.data ?? {};
      const defaultPackageId = String(payload?.default_package_id ?? "");
      const priceRows = Array.isArray(payload?.tld_prices) ? (payload.tld_prices as any[]) : [];

      if (defaultPackageId) {
        setPricingPackageId(defaultPackageId);
      } else if (pkgOptions.length) {
        // fallback to first package (silent)
        setPricingPackageId(pkgOptions[0].id);
      }

      const normalized = priceRows
        .map((r) => ({ tld: normalizeTld(r?.tld), price_usd: safeNumber(r?.price_usd) }))
        .filter((r) => r.tld);

      // If backend has no rows yet, always show default rows so admin can input prices
      setTldPrices(normalized.length ? normalized : defaultTldRows);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Gagal memuat Domain Pricing";
      if (String(msg).toLowerCase().includes("unauthorized")) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setPricingLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const { data: row } = await (supabase as any)
        .from("website_settings")
        .select("value")
        .eq("key", SETTINGS_SUBSCRIPTION_PLANS_KEY)
        .maybeSingle();

      const v = row?.value;
      const parsed = Array.isArray(v)
        ? (v as any[])
            .map((r) => ({
              years: asNumber(r?.years),
              label: String(r?.label ?? "").trim(),
              price_usd: asNumber(r?.price_usd, 0),
              is_active: typeof r?.is_active === "boolean" ? r.is_active : true,
              sort_order: asNumber(r?.sort_order),
            }))
            .filter((r) => r.years > 0)
        : [];

      setPlans(
        parsed.length
          ? parsed.map((p) => ({
              ...p,
              label: p.label || `${p.years} Tahun`,
              sort_order: p.sort_order || p.years,
            }))
          : [
              { years: 1, label: "1 Tahun", price_usd: 0, is_active: true, sort_order: 1 },
              { years: 2, label: "2 Tahun", price_usd: 0, is_active: true, sort_order: 2 },
              { years: 3, label: "3 Tahun", price_usd: 0, is_active: true, sort_order: 3 },
            ],
      );
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Gagal memuat Subscription Plans";
      if (String(msg).toLowerCase().includes("unauthorized")) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchDomainPricing();
    fetchPlans();
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

      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, preview_url: publicUrl } : t)));
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

      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, preview_url: "" } : t)));
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

  const saveDomainPricing = async () => {
    setPricingSaving(true);
    try {
      const pkgId = String(pricingPackageId ?? "").trim() || String(packages?.[0]?.id ?? "").trim();
      if (!pkgId) {
        toast({
          variant: "destructive",
          title: "Gagal menyimpan",
          description: "Tidak ada Package tersedia untuk konteks pricing. Buat/aktifkan package dulu.",
        });
        return;
      }

      // normalize + validate, then de-dupe by TLD (last write wins)
      const cleaned = tldPrices
        .map((r) => ({ tld: normalizeTld(r.tld), price_usd: safeNumber(r.price_usd) }))
        .filter((r) => r.tld && Number.isFinite(r.price_usd) && r.price_usd >= 0);

      const dedupedMap = new Map<string, number>();
      for (const row of cleaned) dedupedMap.set(row.tld, row.price_usd);
      const deduped = Array.from(dedupedMap.entries()).map(([tld, price_usd]) => ({ tld, price_usd }));

      const { data, error } = await (supabase as any).functions.invoke("admin-order-domain-pricing", {
        body: {
          action: "set",
          default_package_id: pkgId,
          tld_prices: deduped,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: "Saved", description: "Domain pricing updated." });
      await fetchDomainPricing();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to save", description: e?.message ?? "Unknown error" });
    } finally {
      setPricingSaving(false);
    }
  };

  const savePlans = async () => {
    setPlansSaving(true);
    try {
      const payload = plans
        .map((p) => ({
          years: asNumber(p.years),
          label: String(p.label ?? "").trim() || `${asNumber(p.years)} Tahun`,
          price_usd: asNumber(p.price_usd, 0),
          is_active: p.is_active !== false,
          sort_order: asNumber(p.sort_order, asNumber(p.years)),
        }))
        .filter((p) => p.years > 0);

      const { error } = await (supabase as any)
        .from("website_settings")
        .upsert({ key: SETTINGS_SUBSCRIPTION_PLANS_KEY, value: payload }, { onConflict: "key" });
      if (error) throw error;

      toast({ title: "Saved", description: "Subscription plans updated." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to save", description: e?.message ?? "Unknown error" });
    } finally {
      setPlansSaving(false);
    }
  };

  const templateCountLabel = useMemo(() => String(templates.length), [templates.length]);
  const plansCountLabel = useMemo(() => String(plans.length), [plans.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Domain Tools (Order)</h1>
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
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
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

              <div className="grid gap-3 md:grid-cols-[320px_1fr]">
                {/* Categories panel */}
                <div className="rounded-md border bg-muted/20 p-3 md:sticky md:top-3 self-start">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Template Categories</p>
                      <p className="text-xs text-muted-foreground">Klik category untuk memfilter templates.</p>
                    </div>
                    <Badge variant="outline">{categories.length}</Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs">Cari category</Label>
                      <Input value={categoryQuery} onChange={(e) => setCategoryQuery(e.target.value)} placeholder="Cari category..." disabled={saving} />
                    </div>

                    <div>
                      <Label className="text-xs">New category</Label>
                      <div className="flex gap-2">
                        <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="contoh: ecommerce" disabled={saving} />
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

                    <ScrollArea className="h-[420px] pr-2">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter("all")}
                          className="w-full rounded-md border bg-background px-2 py-2 text-left text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">All</span>
                            <Badge variant="outline">{templates.length}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">Tampilkan semua template</div>
                        </button>

                        {(filteredCategories.length ? filteredCategories : []).map((c) => (
                          <div key={c.name} className="rounded-md border bg-background p-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                className="text-left"
                                onClick={() => setTemplateCategoryFilter(c.name)}
                                title="Klik untuk filter"
                              >
                                <div className="text-sm font-medium text-foreground">{c.name}</div>
                                <div className="text-xs text-muted-foreground">Used: {c.count}</div>
                              </button>
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
                              <TableHead className="w-[220px]">Category</TableHead>
                              <TableHead className="w-[120px]">Sort</TableHead>
                              <TableHead className="w-[160px]">Status</TableHead>
                              <TableHead className="w-[210px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagedTemplates.map((t) => {
                              const idx = templates.findIndex((x) => x.id === t.id);
                              const previewSrc = String((t as any)?.preview_url ?? "").trim();

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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain">
          <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Domain Pricing (TLD)</CardTitle>
              <CardDescription>Atur harga domain per-TLD untuk halaman /order/choose-domain.</CardDescription>
            </div>
            <Badge variant="outline">Rows: {tldPrices.length}</Badge>
          </div>
        </CardHeader>
         <CardContent className="space-y-3">
          {pricingLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}

          {!pricingLoading && tldPrices.length ? (
            tldPrices.map((r, idx) => (
              <div key={`${r.tld}-${idx}`} className="grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-5">
                <div className="md:col-span-2">
                  <Label className="text-xs">TLD</Label>
                  <Input
                    value={String(r.tld ?? "")}
                    onChange={(e) =>
                      setTldPrices((prev) => prev.map((x, i) => (i === idx ? { ...x, tld: e.target.value } : x)))
                    }
                    placeholder="com"
                    disabled={pricingSaving}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Price (USD)</Label>
                  <Input
                    value={String(r.price_usd)}
                    onChange={(e) =>
                      setTldPrices((prev) => prev.map((x, i) => (i === idx ? { ...x, price_usd: safeNumber(e.target.value) } : x)))
                    }
                    inputMode="decimal"
                    disabled={pricingSaving}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setTldPrices((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={pricingSaving || tldPrices.length <= 1}
                    aria-label="Remove tld"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : !pricingLoading ? (
            <div className="text-sm text-muted-foreground">Belum ada pricing.</div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTldPrices((prev) => [...prev, { tld: "", price_usd: 0 }])}
              disabled={pricingSaving}
            >
              <Plus className="h-4 w-4 mr-2" /> Add TLD
            </Button>
            <Button type="button" onClick={saveDomainPricing} disabled={pricingSaving}>
              <Save className="h-4 w-4 mr-2" /> Simpan Pricing
            </Button>
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
         <CardHeader>
           <div className="flex items-start justify-between gap-3">
             <div>
               <CardTitle>Subscription Plans (Website)</CardTitle>
               <CardDescription>Kelola opsi “Choose plan duration” di halaman /order/subscription.</CardDescription>
             </div>
             <Badge variant="outline">Total: {plansCountLabel}</Badge>
           </div>
         </CardHeader>
         <CardContent className="space-y-3">
           {plansLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}

            {!plansLoading && plans.length ? (
              plans.map((p, idx) => (
                <div key={`${p.years}-${idx}`} className="grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-6">
                 <div>
                   <Label className="text-xs">Years</Label>
                   <Input
                     value={String(p.years)}
                     onChange={(e) =>
                        setPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, years: asNumber(e.target.value) } : x)))}
                     inputMode="numeric"
                     disabled={plansSaving}
                   />
                 </div>

                 <div className="md:col-span-2">
                   <Label className="text-xs">Label</Label>
                   <Input
                     value={p.label}
                     onChange={(e) => setPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                     disabled={plansSaving}
                   />
                 </div>

                  <div>
                    <Label className="text-xs">Price (USD)</Label>
                    <Input
                      value={String(p.price_usd ?? 0)}
                      onChange={(e) =>
                        setPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, price_usd: asNumber(e.target.value, 0) } : x)))
                      }
                      inputMode="decimal"
                      disabled={plansSaving}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Sort</Label>
                    <Input
                      value={String(p.sort_order)}
                      onChange={(e) =>
                        setPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, sort_order: asNumber(e.target.value) } : x)))
                      }
                      inputMode="numeric"
                      disabled={plansSaving}
                    />
                  </div>

                 <div className="flex items-end justify-between gap-2">
                   <div className="flex items-center gap-2">
                     <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "On" : "Off"}</Badge>
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                       onClick={() => setPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, is_active: !x.is_active } : x)))}
                       disabled={plansSaving}
                     >
                       Toggle
                     </Button>
                   </div>
                   <Button
                     type="button"
                     variant="outline"
                     size="icon"
                     onClick={() => setPlans((prev) => prev.filter((_, i) => i !== idx))}
                     disabled={plansSaving}
                     aria-label="Remove plan"
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             ))
           ) : !plansLoading ? (
             <div className="text-sm text-muted-foreground">Belum ada plan. Klik “Add Plan”.</div>
           ) : null}

           <div className="flex flex-wrap gap-2">
             <Button
               type="button"
               variant="outline"
               onClick={() =>
                 setPlans((prev) => [
                   ...prev,
                   {
                     years: 1,
                     label: "1 Tahun",
                      price_usd: 0,
                     is_active: true,
                     sort_order: prev.length ? Math.max(...prev.map((x) => x.sort_order)) + 1 : 1,
                   },
                 ])
               }
               disabled={plansSaving}
             >
               <Plus className="h-4 w-4 mr-2" /> Add Plan
             </Button>
             <Button type="button" onClick={savePlans} disabled={plansSaving}>
               <Save className="h-4 w-4 mr-2" /> Simpan
             </Button>
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
