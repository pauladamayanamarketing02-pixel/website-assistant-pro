import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, RefreshCcw } from "lucide-react";

type PackageRow = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  price: number | null;
  features: string[];
  is_active: boolean;
  created_at?: string;
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

export default function SuperAdminPackages() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [editPackage, setEditPackage] = useState<PackageRow | null>(null);
  const [open, setOpen] = useState(false);

  const title = "Services / Packages";

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("packages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setPackages(
        ((data as any[]) || []).map((p) => ({
          id: String(p.id),
          name: String(p.name ?? ""),
          type: String(p.type ?? ""),
          description: (p.description ?? null) as string | null,
          price: (p.price ?? null) as number | null,
          features: normalizeFeatures(p.features),
          is_active: Boolean(p.is_active),
          created_at: p.created_at,
        }))
      );
    } catch (err) {
      console.error("Error fetching packages:", err);
      toast.error("Gagal memuat packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const canSave = useMemo(() => {
    if (!editPackage) return false;
    if (!editPackage.name.trim()) return false;
    return true;
  }, [editPackage]);

  const handleSave = async () => {
    if (!editPackage) return;
    if (!canSave) return;

    setSaving(true);
    try {
      const payload = {
        name: editPackage.name.trim(),
        description: editPackage.description?.trim() || null,
        price: editPackage.price,
        features: editPackage.features,
        is_active: editPackage.is_active,
      };

      const { error } = await (supabase as any)
        .from("packages")
        .update(payload)
        .eq("id", editPackage.id);

      if (error) throw error;

      toast.success("Package berhasil disimpan");
      setOpen(false);
      setEditPackage(null);
      await fetchPackages();
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">Mengubah data di sini akan mempengaruhi paket pada halaman onboarding.</p>
        </div>

        <Button variant="outline" onClick={fetchPackages} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading packages...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="capitalize">{pkg.type}</TableCell>
                    <TableCell>${pkg.price?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          pkg.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditPackage(pkg);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
          </DialogHeader>

          {editPackage && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={editPackage.name}
                  onChange={(e) => setEditPackage({ ...editPackage, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Type</Label>
                <Input value={editPackage.type} disabled />
                <p className="text-xs text-muted-foreground">Type dikunci karena dipakai sebagai identifier paket.</p>
              </div>

              <div className="grid gap-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={editPackage.price ?? 0}
                  onChange={(e) =>
                    setEditPackage({
                      ...editPackage,
                      price: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editPackage.description ?? ""}
                  onChange={(e) => setEditPackage({ ...editPackage, description: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={editPackage.features.join("\n")}
                  onChange={(e) =>
                    setEditPackage({
                      ...editPackage,
                      features: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  rows={6}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Active</div>
                  <div className="text-xs text-muted-foreground">Paket non-aktif tidak tampil di onboarding.</div>
                </div>
                <Switch
                  checked={editPackage.is_active}
                  onCheckedChange={(v) => setEditPackage({ ...editPackage, is_active: v })}
                />
              </div>

              <Button className="w-full" onClick={handleSave} disabled={!canSave || saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
