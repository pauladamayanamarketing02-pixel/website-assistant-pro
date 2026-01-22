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
};

const SETTINGS_TEMPLATES_KEY = "order_templates";

export default function WebsiteDomainTools() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);

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

  useEffect(() => {
    fetchTemplates();
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

  const templateCountLabel = useMemo(() => String(templates.length), [templates.length]);

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
    </div>
  );
}
