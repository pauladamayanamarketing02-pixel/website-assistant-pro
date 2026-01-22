import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, CreditCard, Mail, KeyRound, Webhook } from "lucide-react";
import { RapidapiDomainrIntegrationCard, type RapidapiDomainrTestResult } from "@/components/super-admin/RapidapiDomainrIntegrationCard";

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

  const [rapidapiKey, setRapidapiKey] = useState("");
  const [rapidapiConfigured, setRapidapiConfigured] = useState(false);
  const [rapidapiUpdatedAt, setRapidapiUpdatedAt] = useState<string | null>(null);
  const [rapidapiTestDomain, setRapidapiTestDomain] = useState("example.com");
  const [rapidapiTestResult, setRapidapiTestResult] = useState<RapidapiDomainrTestResult | null>(null);

  const fetchRapidapiStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-rapidapi-domainr-secret", { action: "get" });
      if (error) throw error;
      setRapidapiConfigured(Boolean((data as any)?.configured));
      setRapidapiUpdatedAt(((data as any)?.updated_at ?? null) as string | null);
    } catch (e: any) {
      console.error(e);
      if (String(e?.message ?? "").toLowerCase().includes("unauthorized")) {
        toast.error("Session expired. Silakan login ulang.");
        navigate("/super-admin/login", { replace: true });
        return;
      }
      toast.error(e?.message || "Gagal memuat status RapidAPI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapidapiStatus();
  }, []);

  const onSaveRapidapiKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = rapidapiKey.trim();
      if (!v) throw new Error("RapidAPI key wajib diisi");
      if (/\s/.test(v) || v.length < 10) throw new Error("RapidAPI key tidak valid");

      const { error } = await invokeWithAuth<any>("super-admin-rapidapi-domainr-secret", { action: "set", api_key: v });
      if (error) throw error;

      setRapidapiKey("");
      toast.success("RapidAPI key tersimpan");
      await fetchRapidapiStatus();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan RapidAPI key");
    } finally {
      setLoading(false);
    }
  };

  const onClearRapidapiKey = async () => {
    setLoading(true);
    try {
      const { error } = await invokeWithAuth<any>("super-admin-rapidapi-domainr-secret", { action: "clear" });
      if (error) throw error;
      toast.success("RapidAPI key di-reset");
      await fetchRapidapiStatus();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal reset RapidAPI key");
    } finally {
      setLoading(false);
    }
  };

  const onTestRapidapiDomainr = async () => {
    setLoading(true);
    setRapidapiTestResult(null);
    try {
      const d = rapidapiTestDomain.trim();
      if (!d) throw new Error("Domain test wajib diisi");

      const { data, error } = await supabase.functions.invoke<any>("rapidapi-domainr-check", { body: { query: d } });
      if (error) {
        const resp = (error as any)?.context?.response;
        if (resp) {
          const payload = await resp.json().catch(() => null);
          throw new Error(payload?.error || error.message);
        }
        throw error;
      }

      const items = ((data as any)?.items ?? []) as Array<{ domain: string; status: string }>;
      const exact = items.find((it) => String(it.domain).toLowerCase() === d.toLowerCase()) ?? null;

      const result: RapidapiDomainrTestResult = {
        domain: exact?.domain ?? d,
        status: (exact?.status as any) ?? "unknown",
      };
      setRapidapiTestResult(result);

      if (result.status === "available") toast.success("Available");
      else if (result.status === "unavailable") toast.error("Unavailable");
      else if (result.status === "premium") toast.message("Premium");
      else toast.message("Unknown");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal test RapidAPI");
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
        <RapidapiDomainrIntegrationCard
          loading={loading}
          status={{ configured: rapidapiConfigured, updatedAt: rapidapiUpdatedAt }}
          apiKeyValue={rapidapiKey}
          onApiKeyChange={setRapidapiKey}
          onSave={onSaveRapidapiKey}
          onRefresh={fetchRapidapiStatus}
          onClear={onClearRapidapiKey}
          testDomainValue={rapidapiTestDomain}
          onTestDomainChange={setRapidapiTestDomain}
          onTest={onTestRapidapiDomainr}
          testResult={rapidapiTestResult}
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
