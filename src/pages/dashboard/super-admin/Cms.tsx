import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, CreditCard, Mail, KeyRound, Webhook } from "lucide-react";
import { DomainDuckIntegrationCard, type DomainDuckTestResult } from "@/components/super-admin/DomainDuckIntegrationCard";

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

  const [domainduckKey, setDomainduckKey] = useState("");
  const [domainduckConfigured, setDomainduckConfigured] = useState(false);
  const [domainduckUpdatedAt, setDomainduckUpdatedAt] = useState<string | null>(null);
  const [domainduckTestDomain, setDomainduckTestDomain] = useState("example.com");
  const [domainduckTestResult, setDomainduckTestResult] = useState<DomainDuckTestResult | null>(null);

  const fetchDomainDuckStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "get" });
      if (error) throw error;
      setDomainduckConfigured(Boolean((data as any)?.configured));
      setDomainduckUpdatedAt(((data as any)?.updated_at ?? null) as string | null);
    } catch (e: any) {
      console.error(e);
      if (String(e?.message ?? "").toLowerCase().includes("unauthorized")) {
        toast.error("Session expired. Silakan login ulang.");
        navigate("/super-admin/login", { replace: true });
        return;
      }
      toast.error(e?.message || "Gagal memuat status DomainDuck");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainDuckStatus();
  }, []);

  const onSaveDomainDuckKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = domainduckKey.trim();
      if (!v) throw new Error("API key wajib diisi");
      if (/\s/.test(v) || v.length < 8) throw new Error("API key tidak valid");

      const { error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "set", api_key: v });
      if (error) throw error;

      setDomainduckKey("");
      toast.success("API key tersimpan");
      await fetchDomainDuckStatus();

      // Ensure Test + Search Domain become immediately usable with the new key.
      // Auto-run a quick test using the current test domain (if any).
      if (domainduckTestDomain.trim()) {
        await onTestDomainDuck();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan API key");
    } finally {
      setLoading(false);
    }
  };

  const onClearDomainDuckKey = async () => {
    setLoading(true);
    try {
      const { error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "clear" });
      if (error) throw error;
      toast.success("API key di-reset");
      setDomainduckTestResult(null);
      await fetchDomainDuckStatus();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal reset API key");
    } finally {
      setLoading(false);
    }
  };

  const onTestDomainDuck = async () => {
    setLoading(true);
    setDomainduckTestResult(null);
    try {
      const d = domainduckTestDomain.trim();
      if (!d) throw new Error("Domain test wajib diisi");

      const { data, error } = await supabase.functions.invoke<any>("domainduck-check", { body: { domain: d } });
      if (error) {
        const resp = (error as any)?.context?.response;
        if (resp) {
          const payload = await resp.json().catch(() => null);
          throw new Error(payload?.error || error.message);
        }
        throw error;
      }

      const availability = String((data as any)?.availability ?? "blocked") as any;
      const result: DomainDuckTestResult = { domain: d, availability };
      setDomainduckTestResult(result);

      if (availability === "true") toast.success("Available");
      else if (availability === "false") toast.error("Unavailable");
      else if (availability === "premium") toast.message("Premium Domain");
      else toast.message("Not Available");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal test DomainDuck");
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
        <DomainDuckIntegrationCard
          loading={loading}
          status={{ configured: domainduckConfigured, updatedAt: domainduckUpdatedAt }}
          apiKeyValue={domainduckKey}
          onApiKeyChange={setDomainduckKey}
          onSave={onSaveDomainDuckKey}
          onRefresh={fetchDomainDuckStatus}
          onClear={onClearDomainDuckKey}
          testDomainValue={domainduckTestDomain}
          onTestDomainChange={setDomainduckTestDomain}
          onTest={onTestDomainDuck}
          testResult={domainduckTestResult}
        />

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

        {/* Domain Lookup configured above (DomainDuck) */}

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
