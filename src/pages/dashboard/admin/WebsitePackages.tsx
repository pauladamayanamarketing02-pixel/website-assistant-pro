import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, RefreshCcw, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  type: string;
  is_active: boolean;
  show_on_public: boolean;
  created_at: string;
};

export default function WebsitePackages() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("id,name,description,price,type,is_active,show_on_public,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages((data ?? []) as PackageRow[]);
    } catch (err) {
      console.error("Error fetching packages:", err);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const toggleShowOnPublic = (id: string) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, show_on_public: !pkg.show_on_public } : pkg))
    );
  };

  const finishEdit = async () => {
    setSaving(true);
    try {
      const updates = packages.map((pkg) => ({
        id: pkg.id,
        show_on_public: pkg.show_on_public,
      }));

      for (const upd of updates) {
        const { error } = await supabase
          .from("packages")
          .update({ show_on_public: upd.show_on_public })
          .eq("id", upd.id);

        if (error) throw error;
      }

      toast.success("Public visibility updated successfully");
      setLastSavedAt(new Date());
      setIsEditing(false);
      await fetchPackages();
    } catch (err) {
      console.error("Error saving packages:", err);
      toast.error("Failed to update packages");
    } finally {
      setSaving(false);
    }
  };

  const canSave = isEditing && !saving;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Public Packages</h1>
            <p className="text-sm text-muted-foreground">
              Control which packages appear on the public /packages page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {saving ? (
              <span className="flex items-center gap-2 text-primary">
                <RefreshCcw className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            ) : lastSavedAt ? (
              <>Saved at {lastSavedAt.toLocaleTimeString()}</>
            ) : (
              "Click Done to save changes."
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Website</Badge>
          <Badge variant="outline">Packages</Badge>

          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); fetchPackages(); }} disabled={saving}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button size="sm" onClick={finishEdit} disabled={!canSave}>
                <Save className="h-4 w-4 mr-2" /> Done
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)} disabled={loading}>
              Edit
            </Button>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Packages</CardTitle>
              <CardDescription>
                Toggle "Show on Public" to control which packages appear at /packages. Only active packages with "Show on Public" enabled will be visible to visitors.
              </CardDescription>
            </div>

            <Button variant="outline" size="sm" onClick={fetchPackages} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading packages...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Show on Public</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No packages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell className="capitalize">{pkg.type}</TableCell>
                      <TableCell>
                        {pkg.price != null ? `$${Number(pkg.price).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {pkg.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleShowOnPublic(pkg.id)}
                          disabled={!isEditing}
                          className={pkg.show_on_public ? "text-primary" : "text-muted-foreground"}
                        >
                          {pkg.show_on_public ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hidden
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}