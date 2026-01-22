import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe, BarChart3, CreditCard, Mail, KeyRound, Webhook, Save, RefreshCcw } from "lucide-react";

async function getAccessToken() {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  // If session is missing/expired, attempt a refresh once.
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
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function SuperAdminCms() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [domainrKey, setDomainrKey] = useState("");

  const [domainrConfigured, setDomainrConfigured] = useState(false);
  const [domainrUpdatedAt, setDomainrUpdatedAt] = useState<string | null>(null);

  const fetchDomainrStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-domainr-secret", { action: "get" });
      if (error) throw error;

      setDomainrConfigured(Boolean((data as any)?.configured));
      setDomainrUpdatedAt(((data as any)?.updated_at ?? null) as string | null);
    } catch (e: any) {
      console.error(e);
      if (String(e?.message ?? "").toLowerCase().includes("unauthorized")) {
        toast.error("Session expired. Silakan login ulang.");
        navigate("/super-admin/login", { replace: true });
        return;
      }
      toast.error(e?.message || "Gagal memuat status Domainr");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainrStatus();
  }, []);

  const onSaveDomainrKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = domainrKey.trim();
      if (!v) throw new Error("Domainr API key wajib diisi");

      const { error } = await invokeWithAuth<any>("super-admin-domainr-secret", { action: "set", api_key: v });
      if (error) throw error;

      setDomainrKey("");
      toast.success("Domainr API key tersimpan");
      await fetchDomainrStatus();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan Domainr API key");
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
                <Globe className="h-4 w-4" /> Domain Lookup (Domainr)
              </CardTitle>
              <Badge variant={domainrConfigured ? "default" : "secondary"}>{domainrConfigured ? "Configured" : "Not set"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Simpan Domainr key untuk real-time domain checking di flow Order.
            <div className="mt-4">
              <form onSubmit={onSaveDomainrKey} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="domainr_key">Domainr API key</Label>
                  <Input
                    id="domainr_key"
                    type="password"
                    value={domainrKey}
                    onChange={(e) => setDomainrKey(e.target.value)}
                    placeholder="Tempel Domainr key di sini..."
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> Simpan
                  </Button>
                  <Button type="button" variant="outline" onClick={fetchDomainrStatus} disabled={loading}>
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh status
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-xs text-muted-foreground">
                Disimpan sebagai <span className="font-medium text-foreground">domainr/api_key</span>.
                {domainrUpdatedAt ? <span> Terakhir update: {new Date(domainrUpdatedAt).toLocaleString()}</span> : null}
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

        {/* Domain Lookup configured above (Domainr) */}

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
