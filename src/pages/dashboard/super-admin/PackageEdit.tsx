import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type PackageRow = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  price: number | null;
  features: string[];
  is_active: boolean;
};

function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v) => typeof v === "string") as string[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === "string") as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function SuperAdminPackageEdit() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pkg, setPkg] = useState<PackageRow | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/dashboard/super-admin/packages", { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("packages")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error("Package tidak ditemukan");
          navigate("/dashboard/super-admin/packages", { replace: true });
          return;
        }

        setPkg({
          id: String(data.id),
          name: String(data.name ?? ""),
          type: String(data.type ?? ""),
          description: (data.description ?? null) as string | null,
          price: (data.price ?? null) as number | null,
          features: normalizeFeatures(data.features),
          is_active: Boolean(data.is_active),
        });
      } catch (err) {
        console.error("Error fetching package:", err);
        toast.error("Gagal memuat package");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const canSave = useMemo(() => {
    if (!pkg) return false;
    if (!pkg.name.trim()) return false;
    return true;
  }, [pkg]);

  const handleSave = async () => {
    if (!pkg) return;
    if (!canSave) return;

    setSaving(true);
    try {
      const payload = {
        name: pkg.name.trim(),
        description: pkg.description?.trim() || null,
        price: pkg.price,
        features: pkg.features,
        is_active: pkg.is_active,
      };

      const { error } = await (supabase as any).from("packages").update(payload).eq("id", pkg.id);
      if (error) throw error;

      toast.success("Package berhasil disimpan");
      navigate("/dashboard/super-admin/packages");
    } catch (err: any) {
      console.error("Error saving package:", err);
      toast.error(err?.message || "Gagal menyimpan package");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/super-admin/packages")}
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Edit Package</h1>
          </div>
          <p className="text-muted-foreground">Changes here will appear on the onboarding pages.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? "Loading..." : pkg?.name || "Package"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !pkg ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={pkg.name} onChange={(e) => setPkg({ ...pkg, name: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label>Type</Label>
                <Input value={pkg.type} disabled />
                <p className="text-xs text-muted-foreground">Type is locked because it is used as the package identifier.</p>
              </div>

              <div className="grid gap-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={pkg.price ?? 0}
                  onChange={(e) =>
                    setPkg({
                      ...pkg,
                      price: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={pkg.description ?? ""} onChange={(e) => setPkg({ ...pkg, description: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={pkg.features.join("\n")}
                  onChange={(e) =>
                    setPkg({
                      ...pkg,
                      features: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  rows={8}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Active</div>
                  <div className="text-xs text-muted-foreground">Inactive packages won't show up in onboarding.</div>
                </div>
                <Switch checked={pkg.is_active} onCheckedChange={(v) => setPkg({ ...pkg, is_active: v })} />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleSave} disabled={!canSave || saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  className="flex-1"
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/super-admin/packages")}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
