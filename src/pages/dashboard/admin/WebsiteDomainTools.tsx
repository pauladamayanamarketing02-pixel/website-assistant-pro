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
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";

type TemplateRow = {
  id: string;
  name: string;
  category: "business" | "portfolio" | "service" | "agency";
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
      const { data: tplRow } = await (supabase as any)
        .from("website_settings")
        .select("value")
        .eq("key", SETTINGS_TEMPLATES_KEY)
        .maybeSingle();

      setTemplates(Array.isArray(tplRow?.value) ? (tplRow.value as any) : []);
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
      const pkgId = String(pricingPackageId ?? "").trim();
      // pkgId is internal; ensure we always send something if available

      const cleaned = tldPrices
        .map((r) => ({ tld: normalizeTld(r.tld), price_usd: safeNumber(r.price_usd) }))
        .filter((r) => r.tld && Number.isFinite(r.price_usd) && r.price_usd >= 0);

      const { data, error } = await (supabase as any).functions.invoke("admin-order-domain-pricing", {
        body: {
          action: "set",
          default_package_id: pkgId || null,
          tld_prices: cleaned,
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

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Order Templates</CardTitle>
              <CardDescription>Daftar template yang tampil di /order/choose-design.</CardDescription>
            </div>
            <Badge variant="outline">Total: {templateCountLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}

           {!loading && templates.length ? (
             templates.map((t, idx) => (
               <div key={t.id} className="grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-6">
                 <div className="md:col-span-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={t.name}
                    onChange={(e) => setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                    disabled={saving}
                  />
                </div>

                 <div className="md:col-span-2">
                   <Label className="text-xs">Preview URL</Label>
                   <div className="flex gap-2">
                     <Input
                       value={String((t as any)?.preview_url ?? "")}
                       onChange={(e) =>
                         setTemplates((prev) =>
                           prev.map((x, i) => (i === idx ? { ...x, preview_url: e.target.value } : x)),
                         )
                       }
                       placeholder="https://..."
                       disabled={saving}
                     />
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => {
                         const url = String((t as any)?.preview_url ?? "").trim();
                         if (!url) return;
                         window.open(url, "_blank", "noopener,noreferrer");
                       }}
                       disabled={saving || !String((t as any)?.preview_url ?? "").trim()}
                     >
                       Preview
                     </Button>
                   </div>
                 </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={t.category}
                    onValueChange={(v) => setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, category: v as any } : x)))}
                  >
                    <SelectTrigger disabled={saving}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">business</SelectItem>
                      <SelectItem value="service">service</SelectItem>
                      <SelectItem value="portfolio">portfolio</SelectItem>
                      <SelectItem value="agency">agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sort</Label>
                  <Input
                    value={String(t.sort_order ?? 0)}
                    onChange={(e) =>
                      setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, sort_order: Number(e.target.value) } : x)))
                    }
                    inputMode="numeric"
                    disabled={saving}
                  />
                </div>
                 <div className="flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={t.is_active === false ? "secondary" : "default"}>{t.is_active === false ? "Off" : "On"}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, is_active: x.is_active === false } : x)))}
                      disabled={saving}
                    >
                      Toggle
                    </Button>
                  </div>
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
              </div>
            ))
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
        </CardContent>
      </Card>

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
                  <div className="mt-2 flex h-10 items-center rounded-md border bg-background px-3 text-sm text-foreground">
                    .{r.tld}
                  </div>
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
            <Button type="button" onClick={saveDomainPricing} disabled={pricingSaving}>
              <Save className="h-4 w-4 mr-2" /> Simpan Pricing
            </Button>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
