import type { FormEvent } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";

type PackageRow = { id: string; name: string; price: number | null; type: string };

type TldPriceRow = { tld: string; price_usd: string | number };

type TemplateRow = {
  id: string;
  name: string;
  category: "business" | "portfolio" | "service" | "agency";
  is_active?: boolean;
  sort_order?: number;
};

type OrderContact = {
  heading: string;
  description?: string;
  whatsapp_phone?: string;
  whatsapp_message?: string;
  email?: string;
};

const SETTINGS_TEMPLATES_KEY = "order_templates";
const SETTINGS_CONTACT_KEY = "order_contact";

async function getAccessToken() {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  if (!sessionData.session) {
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr) throw refreshErr;
    if (!refreshed.session?.access_token) throw new Error("Unauthorized: session not found");
    return refreshed.session.access_token;
  }
  return sessionData.session.access_token;
}

async function invokeWithAuth<T>(fnName: string, body: unknown) {
  const token = await getAccessToken();
  return supabase.functions.invoke<T>(fnName, {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
}

function normalizeTld(input: string) {
  return (input ?? "").trim().toLowerCase().replace(/^\./, "");
}

function formatUsd(value: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function WebsiteDomainTools() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [packages, setPackages] = useState<PackageRow[]>([]);

  // Domain pricing
  const [defaultPackageId, setDefaultPackageId] = useState<string | null>(null);
  const [tldPrices, setTldPrices] = useState<Array<{ tld: string; price_usd: string }>>([]);

  // Templates
  const [templates, setTemplates] = useState<TemplateRow[]>([]);

  // Contact
  const [contact, setContact] = useState<OrderContact>({
    heading: "Butuh bantuan?",
    description: "Hubungi kami untuk bantuan order.",
    whatsapp_phone: "",
    whatsapp_message: "",
    email: "",
  });

  const activePackageLabel = useMemo(() => {
    const p = packages.find((x) => x.id === defaultPackageId);
    return p ? `${p.name}` : "—";
  }, [defaultPackageId, packages]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // packages (admin can read)
      const { data: pkgs, error: pkgErr } = await supabase.from("packages").select("id,name,price,type");
      if (pkgErr) throw pkgErr;
      setPackages((pkgs ?? []) as any);

      // website_settings templates + contact (admin can update via RLS)
      const [{ data: tplRow }, { data: contactRow }] = await Promise.all([
        (supabase as any).from("website_settings").select("value").eq("key", SETTINGS_TEMPLATES_KEY).maybeSingle(),
        (supabase as any).from("website_settings").select("value").eq("key", SETTINGS_CONTACT_KEY).maybeSingle(),
      ]);
      setTemplates(Array.isArray(tplRow?.value) ? (tplRow.value as any) : []);
      setContact(typeof contactRow?.value === "object" && contactRow?.value ? (contactRow.value as any) : contact);

      // domain pricing via edge function (so admin can write later despite super_admin-only RLS)
      const { data: pricingData, error: pricingErr } = await invokeWithAuth<any>("admin-order-domain-pricing", { action: "get" });
      if (pricingErr) throw pricingErr;
      setDefaultPackageId((pricingData as any)?.default_package_id ?? null);
      const rows = ((pricingData as any)?.tld_prices ?? []) as TldPriceRow[];
      setTldPrices(
        Array.isArray(rows)
          ? rows
              .map((r) => ({ tld: normalizeTld(String((r as any)?.tld ?? "")), price_usd: String((r as any)?.price_usd ?? "") }))
              .filter((r) => r.tld)
          : [],
      );
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

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTldRow = () => {
    setTldPrices((prev) => [...prev, { tld: "", price_usd: "" }]);
  };

  const saveDomainPricing = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const pkgId = defaultPackageId;
      if (!pkgId) throw new Error("Pilih Default Package dulu");

      const cleaned = tldPrices
        .map((r) => ({ tld: normalizeTld(r.tld), price_usd: Number(String(r.price_usd).replace(/,/g, "")) }))
        .filter((r) => r.tld && Number.isFinite(r.price_usd) && r.price_usd >= 0);

      const { error } = await invokeWithAuth<any>("admin-order-domain-pricing", {
        action: "set",
        default_package_id: pkgId,
        tld_prices: cleaned,
      });
      if (error) throw error;
      toast({ title: "Saved", description: "Domain pricing updated." });
      await fetchAll();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to save", description: e?.message ?? "Unknown error" });
    } finally {
      setSaving(false);
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

  const saveContact = async () => {
    setSaving(true);
    try {
      const payload: OrderContact = {
        heading: String(contact.heading ?? "").trim() || "Butuh bantuan?",
        description: String(contact.description ?? "").trim(),
        whatsapp_phone: String(contact.whatsapp_phone ?? "").trim(),
        whatsapp_message: String(contact.whatsapp_message ?? "").trim(),
        email: String(contact.email ?? "").trim(),
      };
      const { error } = await (supabase as any)
        .from("website_settings")
        .upsert({ key: SETTINGS_CONTACT_KEY, value: payload }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "Saved", description: "Order contact updated." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to save", description: e?.message ?? "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  const savePackagePrice = async (pkgId: string, price: string) => {
    setSaving(true);
    try {
      const nextPrice = price.trim() === "" ? null : Number(price);
      if (nextPrice !== null && (!Number.isFinite(nextPrice) || nextPrice < 0)) throw new Error("Harga tidak valid");
      const { error } = await supabase.from("packages").update({ price: nextPrice }).eq("id", pkgId);
      if (error) throw error;
      toast({ title: "Saved", description: "Package price updated." });
      await fetchAll();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed", description: e?.message ?? "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Domain Tools (Order)</h1>
          <p className="text-muted-foreground">Atur harga domain (TLD), template, dan contact info untuk halaman /order.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={fetchAll} disabled={loading || saving}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Domain Pricing (TLD)</CardTitle>
                <CardDescription>Dipakai untuk estimasi harga domain di Order Summary.</CardDescription>
              </div>
              <Badge variant="outline">Default: {activePackageLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <form onSubmit={saveDomainPricing} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Default Package</Label>
                  <Select value={defaultPackageId ?? ""} onValueChange={(v) => setDefaultPackageId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">TLD Prices (USD)</p>
                    <Button type="button" size="sm" variant="outline" onClick={addTldRow} disabled={saving}>
                      <Plus className="h-4 w-4 mr-2" /> Add TLD
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {tldPrices.length ? (
                      tldPrices.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2">
                          <Input
                            value={row.tld}
                            onChange={(e) =>
                              setTldPrices((prev) => prev.map((r, i) => (i === idx ? { ...r, tld: e.target.value } : r)))
                            }
                            placeholder="com"
                            disabled={saving}
                          />
                          <div className="flex gap-2">
                            <Input
                              value={row.price_usd}
                              onChange={(e) =>
                                setTldPrices((prev) => prev.map((r, i) => (i === idx ? { ...r, price_usd: e.target.value } : r)))
                              }
                              placeholder="12.00"
                              inputMode="decimal"
                              disabled={saving}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setTldPrices((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={saving}
                              aria-label="Remove row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Belum ada harga TLD. Klik “Add TLD”.</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" /> Simpan Pricing
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Contact</CardTitle>
            <CardDescription>Ditampilkan di sidebar /order sebagai bantuan cepat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Heading</Label>
              <Input value={contact.heading} onChange={(e) => setContact((c) => ({ ...c, heading: e.target.value }))} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={contact.description ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, description: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Phone</Label>
              <Input
                value={contact.whatsapp_phone ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, whatsapp_phone: e.target.value }))}
                placeholder="+62..."
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Opening Message</Label>
              <Input
                value={contact.whatsapp_message ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, whatsapp_message: e.target.value }))}
                placeholder="Halo, saya mau tanya order..."
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={contact.email ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                placeholder="support@..."
                disabled={saving}
              />
            </div>
            <Button type="button" onClick={saveContact} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> Simpan Contact
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Order Templates</CardTitle>
                <CardDescription>Daftar template yang tampil di /order/choose-design.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
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
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length ? (
              templates.map((t, idx) => (
                <div key={t.id} className="grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={t.name}
                      onChange={(e) => setTemplates((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                      disabled={saving}
                    />
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
            ) : (
              <div className="text-sm text-muted-foreground">Belum ada template. Klik “Add Template”.</div>
            )}

            <div className="flex gap-2">
              <Button type="button" onClick={saveTemplates} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> Simpan Templates
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Package Prices</CardTitle>
            <CardDescription>Harga package yang bisa dipakai untuk perhitungan /order (read/write untuk admin).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue={p.price ?? ""}
                    key={`${p.id}:${p.price ?? ""}`}
                    placeholder="Price (USD)"
                    inputMode="decimal"
                    disabled={saving}
                    onBlur={(e) => savePackagePrice(p.id, e.target.value)}
                    className="w-[180px]"
                  />
                  <div className="text-xs text-muted-foreground">{p.price != null ? formatUsd(Number(p.price)) : "—"}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
