import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { Globe, RefreshCcw, Save, TestTube2, Trash2 } from "lucide-react";

export type RapidapiDomainrTestResult = {
  domain: string;
  status: "available" | "unavailable" | "premium" | "unknown";
};

type Status = {
  configured: boolean;
  updatedAt: string | null;
};

type Props = {
  loading: boolean;
  status: Status;
  apiKeyValue: string;
  onApiKeyChange: (v: string) => void;
  onSave: (e: FormEvent) => void;
  onRefresh: () => void;
  onClear: () => void;
  testDomainValue: string;
  onTestDomainChange: (v: string) => void;
  onTest: () => void;
  testResult: RapidapiDomainrTestResult | null;
};

export function RapidapiDomainrIntegrationCard({
  loading,
  status,
  apiKeyValue,
  onApiKeyChange,
  onSave,
  onRefresh,
  onClear,
  testDomainValue,
  onTestDomainChange,
  onTest,
  testResult,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Domain Lookup (RapidAPI → Domainr)
          </CardTitle>
          <Badge variant={status.configured ? "default" : "secondary"}>{status.configured ? "Configured" : "Not set"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Simpan RapidAPI key dan test domain check.

        <div className="mt-4 space-y-4">
          <form onSubmit={onSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rapidapi_key">RapidAPI key</Label>
              <Input
                id="rapidapi_key"
                type="password"
                value={apiKeyValue}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="Tempel RapidAPI key di sini..."
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> Simpan
              </Button>
              <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh status
              </Button>
              <Button type="button" variant="destructive" onClick={onClear} disabled={loading || !status.configured}>
                <Trash2 className="h-4 w-4 mr-2" /> Reset key
              </Button>
            </div>
          </form>

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="rapidapi_domain_test">Test domain</Label>
                <Input
                  id="rapidapi_domain_test"
                  value={testDomainValue}
                  onChange={(e) => onTestDomainChange(e.target.value)}
                  placeholder="contoh: example.com"
                  disabled={loading}
                />
              </div>
              <Button type="button" variant="secondary" onClick={onTest} disabled={loading || !status.configured}>
                <TestTube2 className="h-4 w-4 mr-2" /> Test
              </Button>
            </div>

            {testResult ? (
              <div className="mt-3 text-xs text-muted-foreground">
                Hasil: <span className="font-medium text-foreground">{testResult.domain}</span> →{" "}
                <span className="font-medium text-foreground">{testResult.status}</span>
              </div>
            ) : null}
          </div>

          <div className="text-xs text-muted-foreground">
            Disimpan sebagai <span className="font-medium text-foreground">rapidapi_domainr/api_key</span>.
            {status.updatedAt ? <span> Terakhir update: {new Date(status.updatedAt).toLocaleString()}</span> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
