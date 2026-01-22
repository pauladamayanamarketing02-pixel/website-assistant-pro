import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, RefreshCcw, TestTube2 } from "lucide-react";

export type RapidapiDomainrTestResult = {
  domain: string;
  status: "available" | "unavailable" | "premium" | "unknown";
};

type Props = {
  loading: boolean;
  configured: boolean;
  onRefresh: () => void;
  testDomainValue: string;
  onTestDomainChange: (v: string) => void;
  onTest: () => void;
  testResult: RapidapiDomainrTestResult | null;
};

export function RapidapiDomainrIntegrationCard({
  loading,
  configured,
  onRefresh,
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
          <Badge variant={configured ? "default" : "secondary"}>{configured ? "Configured" : "Not set"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Menggunakan <span className="font-medium text-foreground">RAPIDAPI_DOMAINR_KEY</span> (Function Secret).

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh status
            </Button>
          </div>

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
              <Button type="button" variant="secondary" onClick={onTest} disabled={loading || !configured}>
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
        </div>
      </CardContent>
    </Card>
  );
}
