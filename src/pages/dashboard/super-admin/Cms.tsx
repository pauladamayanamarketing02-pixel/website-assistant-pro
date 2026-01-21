import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe, BarChart3, CreditCard, Mail, KeyRound, Webhook, Save, RefreshCcw } from "lucide-react";

type IntegrationSecretMeta = {
  provider: string;
  name: string;
  updated_at: string;
  is_master_key?: boolean;
};

export default function SuperAdminCms() {
  const [loading, setLoading] = useState(false);
  const [secrets, setSecrets] = useState<IntegrationSecretMeta[]>([]);

  const [masterKey, setMasterKey] = useState("");
  const [oldMasterKey, setOldMasterKey] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");

  const [provider, setProvider] = useState("stripe");
  const [name, setName] = useState("SECRET_KEY");
  const [value, setValue] = useState("");

  const masterKeyConfigured = useMemo(() => {
    return secrets.some((s) => s.provider === "system" && s.name === "INTEGRATIONS_MASTER_KEY");
  }, [secrets]);

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("super-admin-integration-secrets", {
        body: { action: "list" },
      });
      if (error) throw error;
      setSecrets(((data as any)?.items ?? []) as IntegrationSecretMeta[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal memuat status integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const onSetMasterKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const key = masterKey.trim();
      if (!key) throw new Error("Master key wajib diisi");

      const { error } = await supabase.functions.invoke("super-admin-integration-secrets", {
        body: { action: "set_master_key", master_key: key },
      });
      if (error) throw error;

      setMasterKey("");
      toast.success("Master key tersimpan");
      await fetchSecrets();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan master key");
    } finally {
      setLoading(false);
    }
  };

  const onRotateMasterKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const oldKey = oldMasterKey.trim();
      const newKey = newMasterKey.trim();
      if (!oldKey || !newKey) throw new Error("Old & New master key wajib diisi");

      const { error } = await supabase.functions.invoke("super-admin-integration-secrets", {
        body: { action: "rotate_master_key", old_master_key: oldKey, new_master_key: newKey },
      });
      if (error) throw error;

      setOldMasterKey("");
      setNewMasterKey("");
      toast.success("Master key berhasil di-rotate");
      await fetchSecrets();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal rotate master key");
    } finally {
      setLoading(false);
    }
  };

  const onSaveIntegrationKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = provider.trim();
      const n = name.trim();
      const v = value;
      if (!p || !n || !v) throw new Error("Provider, Name, dan Value wajib diisi");

      const { error } = await supabase.functions.invoke("super-admin-integration-secrets", {
        body: { action: "upsert_secret", provider: p, name: n, value: v },
      });
      if (error) throw error;

      setValue("");
      toast.success("API key tersimpan");
      await fetchSecrets();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground">Connect external services needed by the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Integrations Master Key
              </CardTitle>
              <Badge variant={masterKeyConfigured ? "default" : "secondary"}>
                {masterKeyConfigured ? "Active" : "Not set"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Dipakai untuk enkripsi API keys integrasi (disimpan terenkripsi di database).
            <div className="mt-4 space-y-6">
              {!masterKeyConfigured ? (
                <form onSubmit={onSetMasterKey} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="master_key">Master Key</Label>
                    <Input
                      id="master_key"
                      type="password"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      placeholder="Masukkan master key..."
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> Simpan
                  </Button>
                </form>
              ) : (
                <form onSubmit={onRotateMasterKey} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="old_master_key">Old Master Key</Label>
                    <Input
                      id="old_master_key"
                      type="password"
                      value={oldMasterKey}
                      onChange={(e) => setOldMasterKey(e.target.value)}
                      placeholder="Old master key..."
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new_master_key">New Master Key</Label>
                    <Input
                      id="new_master_key"
                      type="password"
                      value={newMasterKey}
                      onChange={(e) => setNewMasterKey(e.target.value)}
                      placeholder="New master key..."
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> Rotate
                  </Button>
                </form>
              )}

              <div>
                <Button type="button" variant="outline" onClick={fetchSecrets} disabled={loading}>
                  <RefreshCcw className="h-4 w-4 mr-2" /> Refresh status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> API Keys (Encrypted)
              </CardTitle>
              <Badge variant={masterKeyConfigured ? "default" : "secondary"}>
                {masterKeyConfigured ? "Ready" : "Need master key"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Simpan API key apa pun (Stripe, Namecheap, dll). Nilai tidak akan ditampilkan lagi.
            <div className="mt-4">
              <form onSubmit={onSaveIntegrationKey} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      placeholder="stripe / namecheap / dll"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="SECRET_KEY" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="password"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Tempel API key di sini..."
                    autoComplete="new-password"
                    disabled={!masterKeyConfigured}
                  />
                </div>
                <Button type="submit" disabled={loading || !masterKeyConfigured}>
                  <Save className="h-4 w-4 mr-2" /> Simpan API Key
                </Button>
              </form>

              <div className="mt-4 rounded-md border border-border p-3">
                <div className="text-xs font-medium text-foreground">Tersimpan</div>
                <div className="mt-2 space-y-1 text-xs">
                  {secrets.filter((s) => !(s.provider === "system" && s.name === "INTEGRATIONS_MASTER_KEY")).length === 0 ? (
                    <div className="text-muted-foreground">Belum ada API key tersimpan.</div>
                  ) : (
                    secrets
                      .filter((s) => !(s.provider === "system" && s.name === "INTEGRATIONS_MASTER_KEY"))
                      .slice(0, 8)
                      .map((s) => (
                        <div key={`${s.provider}:${s.name}`} className="flex items-center justify-between gap-3">
                          <span className="text-foreground">
                            {s.provider}/{s.name}
                          </span>
                          <span className="text-muted-foreground">{new Date(s.updated_at).toLocaleString()}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> GA4 (Google Analytics)
              </CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Store Measurement ID, enable basic event tracking, and verify connection.
            <div className="mt-4">
              <Button variant="outline" disabled>
                <KeyRound className="h-4 w-4 mr-2" /> Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Domain Lookup
              </CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Connect a domain registrar API to power domain search & availability.
            <div className="mt-4">
              <Button variant="outline" disabled>
                <KeyRound className="h-4 w-4 mr-2" /> Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Gateway
              </CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Manage subscriptions, invoices, and payment webhooks.
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" disabled>
                <KeyRound className="h-4 w-4 mr-2" /> Configure
              </Button>
              <Button variant="outline" disabled>
                <Webhook className="h-4 w-4 mr-2" /> Webhooks
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email / Notifications
              </CardTitle>
              <Badge variant="secondary">Ready</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Resend is already configured; we can add templates, test sends, and activity logs.
            <div className="mt-4">
              <Button variant="outline" disabled>
                <KeyRound className="h-4 w-4 mr-2" /> Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
