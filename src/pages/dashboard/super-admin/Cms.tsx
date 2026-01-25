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
import { Ga4IntegrationCard } from "@/components/super-admin/Ga4IntegrationCard";

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
  const [domainduckApiKeyMasked, setDomainduckApiKeyMasked] = useState<string | null>(null);
  const [domainduckRevealedApiKey, setDomainduckRevealedApiKey] = useState<string | null>(null);
  const [domainduckUsage, setDomainduckUsage] = useState<{ used: number; limit: number; exhausted: boolean } | null>(null);
  const [domainduckTestDomain, setDomainduckTestDomain] = useState("example.com");
  const [domainduckTestResult, setDomainduckTestResult] = useState<DomainDuckTestResult | null>(null);

  const [ga4MeasurementId, setGa4MeasurementId] = useState("");
  const [ga4Configured, setGa4Configured] = useState(false);
  const [ga4UpdatedAt, setGa4UpdatedAt] = useState<string | null>(null);
  const [ga4Masked, setGa4Masked] = useState<string | null>(null);

  const fetchGa4Status = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-ga4-settings", { action: "get" });
      if (error) throw error;
      setGa4Configured(Boolean((data as any)?.configured));
      setGa4UpdatedAt(((data as any)?.updated_at ?? null) as string | null);
      setGa4Masked(((data as any)?.measurement_id_masked ?? null) as any);
    } catch (e: any) {
      console.error(e);
      if (String(e?.message ?? "").toLowerCase().includes("unauthorized")) {
        toast.error("Your session has expired. Please sign in again.");
        navigate("/super-admin/login", { replace: true });
        return;
      }
      toast.error(e?.message || "Unable to load GA4 status.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainDuckStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "get" });
      if (error) throw error;
      setDomainduckConfigured(Boolean((data as any)?.configured));
      setDomainduckUpdatedAt(((data as any)?.updated_at ?? null) as string | null);
      setDomainduckUsage(((data as any)?.usage ?? null) as any);
      setDomainduckApiKeyMasked(((data as any)?.api_key_masked ?? null) as any);
      setDomainduckRevealedApiKey(null);
    } catch (e: any) {
      console.error(e);
      if (String(e?.message ?? "").toLowerCase().includes("unauthorized")) {
        toast.error("Your session has expired. Please sign in again.");
        navigate("/super-admin/login", { replace: true });
        return;
      }
      toast.error(e?.message || "Unable to load DomainDuck status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainDuckStatus();
    fetchGa4Status();
  }, []);

  const onSaveGa4 = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = ga4MeasurementId.trim();
      if (!v) throw new Error("Measurement ID is required.");
      if (!/^G-[A-Z0-9]{6,}$/i.test(v)) throw new Error("Invalid Measurement ID format (example: G-CTS53JM1RF).");

      const { error } = await invokeWithAuth<any>("super-admin-ga4-settings", { action: "set", measurement_id: v });
      if (error) throw error;

      setGa4MeasurementId("");
      toast.success("GA4 has been enabled.");
      await fetchGa4Status();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to save GA4 settings.");
    } finally {
      setLoading(false);
    }
  };

  const onClearGa4 = async () => {
    setLoading(true);
    try {
      const { error } = await invokeWithAuth<any>("super-admin-ga4-settings", { action: "clear" });
      if (error) throw error;
      toast.success("GA4 has been disabled.");
      await fetchGa4Status();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to disable GA4.");
    } finally {
      setLoading(false);
    }
  };

  const onSaveDomainDuckKey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = domainduckKey.trim();
      if (!v) throw new Error("API key is required.");
      if (/\s/.test(v) || v.length < 8) throw new Error("Invalid API key.");

      const { error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "set", api_key: v });
      if (error) throw error;

      setDomainduckKey("");
      toast.success("API key has been saved.");
      await fetchDomainDuckStatus();

      // Ensure Test + Search Domain become immediately usable with the new key.
      // Auto-run a quick test using the current test domain (if any).
      if (domainduckTestDomain.trim()) {
        await onTestDomainDuck();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to save API key.");
    } finally {
      setLoading(false);
    }
  };

  const onClearDomainDuckKey = async () => {
    setLoading(true);
    try {
      const { error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "clear" });
      if (error) throw error;
      toast.success("API key has been reset.");
      setDomainduckTestResult(null);
      setDomainduckUsage(null);
      setDomainduckApiKeyMasked(null);
      setDomainduckRevealedApiKey(null);
      await fetchDomainDuckStatus();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to reset API key.");
    } finally {
      setLoading(false);
    }
  };

  const onRevealDomainDuckKey = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<any>("super-admin-domainduck-secret", { action: "reveal" });
      if (error) throw error;
      setDomainduckRevealedApiKey(String((data as any)?.api_key ?? "") || null);
      setDomainduckApiKeyMasked(String((data as any)?.api_key_masked ?? "") || null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to reveal the API key.");
    } finally {
      setLoading(false);
    }
  };

  const onHideDomainDuckKey = () => {
    setDomainduckRevealedApiKey(null);
  };

  const onTestDomainDuck = async () => {
    setLoading(true);
    setDomainduckTestResult(null);
    try {
      const d = domainduckTestDomain.trim();
      if (!d) throw new Error("Test domain is required.");

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

      const usage = (data as any)?.usage;
      if (usage && typeof usage === "object") {
        const used = Number((usage as any)?.used ?? 0);
        const limit = Number((usage as any)?.limit ?? 250);
        setDomainduckUsage({ used, limit, exhausted: used >= limit });
      }

      if (availability === "true") toast.success("Available");
      else if (availability === "false") toast.error("Unavailable");
      else if (availability === "premium") toast.message("Premium Domain");
      else toast.message("Not Available");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "DomainDuck test failed.");
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
          status={{ configured: domainduckConfigured, updatedAt: domainduckUpdatedAt, usage: domainduckUsage, apiKeyMasked: domainduckApiKeyMasked }}
          revealedApiKey={domainduckRevealedApiKey}
          onRevealApiKey={onRevealDomainDuckKey}
          onHideApiKey={onHideDomainDuckKey}
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

        <Ga4IntegrationCard
          loading={loading}
          status={{ configured: ga4Configured, updatedAt: ga4UpdatedAt, measurementIdMasked: ga4Masked }}
          value={ga4MeasurementId}
          onChange={setGa4MeasurementId}
          onSave={onSaveGa4}
          onRefresh={fetchGa4Status}
          onClear={onClearGa4}
        />

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
