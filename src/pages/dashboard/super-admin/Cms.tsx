import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, CreditCard, Mail, KeyRound, Webhook } from "lucide-react";
import { DomainrIntegrationCard } from "@/components/super-admin/DomainrIntegrationCard";
import { WhoapiIntegrationCard, type WhoapiTestResult } from "@/components/super-admin/WhoapiIntegrationCard";

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

  const [domainrConfigured, setDomainrConfigured] = useState(false);
  const [domainrUpdatedAt, setDomainrUpdatedAt] = useState<string | null>(null);

  const [whoapiKey, setWhoapiKey] = useState("");
  const [whoapiConfigured, setWhoapiConfigured] = useState(false);
  const [whoapiUpdatedAt, setWhoapiUpdatedAt] = useState<string | null>(null);
  const [whoapiTestDomain, setWhoapiTestDomain] = useState("example.com");
  const [whoapiTestResult, setWhoapiTestResult] = useState<WhoapiTestResult | null>(null);

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

  const fetchWhoapiStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-whoapi-secret", { action: "get" });
      if (error) throw error;
      setWhoapiConfigured(Boolean((data as any)?.configured));
      setWhoapiUpdatedAt(((data as any)?.updated_at ?? null) as string | null);
    } catch (e: any) {
      console.error(e);
      if (String(e?.message ?? "").toLowerCase().includes("unauthorized")) {
        toast.error("Session expired. Silakan login ulang.");
        navigate("/super-admin/login", { replace: true });
        return;
      }
      toast.error(e?.message || "Gagal memuat status WhoAPI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainrStatus();
    fetchWhoapiStatus();
  }, []);

  const onSaveWhoapiKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = whoapiKey.trim();
      if (!v) throw new Error("WhoAPI API key wajib diisi");

      const { error } = await invokeWithAuth<any>("super-admin-whoapi-secret", { action: "set", api_key: v });
      if (error) throw error;

      setWhoapiKey("");
      toast.success("WhoAPI API key tersimpan");
      await fetchWhoapiStatus();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan WhoAPI API key");
    } finally {
      setLoading(false);
    }
  };

  const onTestWhoapi = async () => {
    setLoading(true);
    setWhoapiTestResult(null);
    try {
      const d = whoapiTestDomain.trim();
      if (!d) throw new Error("Domain test wajib diisi");

      const { data, error } = await supabase.functions.invoke<any>("whoapi-check", { body: { domain: d } });
      if (error) throw error;

      const result: WhoapiTestResult = {
        domain: String((data as any)?.domain ?? d),
        status: (data as any)?.status ?? "unknown",
        registered: (data as any)?.registered ?? null,
      };
      setWhoapiTestResult(result);

      if (result.status === "available") toast.success("Available");
      else if (result.status === "unavailable") toast.error("Unavailable");
      else toast.message("Unknown");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal test WhoAPI");
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
        <DomainrIntegrationCard
          loading={loading}
          configured={domainrConfigured}
          updatedAt={domainrUpdatedAt}
          onRefresh={fetchDomainrStatus}
        />

        <WhoapiIntegrationCard
          loading={loading}
          status={{ configured: whoapiConfigured, updatedAt: whoapiUpdatedAt }}
          apiKeyValue={whoapiKey}
          onApiKeyChange={setWhoapiKey}
          onSave={onSaveWhoapiKey}
          onRefresh={fetchWhoapiStatus}
          testDomainValue={whoapiTestDomain}
          onTestDomainChange={setWhoapiTestDomain}
          onTest={onTestWhoapi}
          testResult={whoapiTestResult}
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
