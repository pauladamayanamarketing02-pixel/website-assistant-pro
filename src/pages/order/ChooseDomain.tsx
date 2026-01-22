import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainSearchBar } from "@/components/order/DomainSearchBar";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";

type DomainStatus = "available" | "unavailable" | "premium";

function evaluateDomain(domain: string): DomainStatus {
  // Placeholder logic (UI-first). Replace with real domain API later.
  const d = domain.toLowerCase();
  if (d.includes("premium") || d.endsWith(".io") || d.endsWith(".ai")) return "premium";
  if (d.length % 3 === 0) return "unavailable";
  return "available";
}

export default function ChooseDomain() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("domain") ?? "";
  const { state, setDomain, setDomainStatus } = useOrder();
  const [lastChecked, setLastChecked] = useState<string>(state.domain || initial);

  const status = useMemo(() => {
    if (!lastChecked) return null;
    return evaluateDomain(lastChecked);
  }, [lastChecked]);

  const alternatives = useMemo(() => {
    if (!lastChecked) return [];
    const base = lastChecked.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const name = base.split(".")[0];
    const tlds = [".com", ".net", ".co", ".io"];
    const variants = [name, `${name}hq`, `get${name}`, `${name}app`];
    const out: string[] = [];
    for (const v of variants) {
      for (const t of tlds) {
        const d = `${v}${t}`;
        if (d !== lastChecked) out.push(d);
        if (out.length >= 8) return out;
      }
    }
    return out;
  }, [lastChecked]);

  const canContinue = status === "available" || status === "premium";

  return (
    <OrderLayout
      title="Choose Domain"
      step="domain"
      sidebar={<OrderSummaryCard />}
    >
      <div className="space-y-6">
        <DomainSearchBar
          initialValue={initial}
          onSubmit={(domain) => {
            setDomain(domain);
            const s = evaluateDomain(domain);
            setDomainStatus(s);
            setLastChecked(domain);
          }}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Domain result</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="text-base font-semibold text-foreground truncate">{lastChecked || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              {status ? (
                <Badge variant={status === "available" ? "secondary" : status === "premium" ? "default" : "outline"}>
                  {status}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Search to check availability</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Smart alternatives</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {alternatives.length ? (
              alternatives.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDomain(d);
                    const s = evaluateDomain(d);
                    setDomainStatus(s);
                    setLastChecked(d);
                  }}
                >
                  {d}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Search a domain to see suggestions.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            size="lg"
            disabled={!canContinue}
            onClick={() => navigate("/order/choose-design")}
          >
            Continue to Design
          </Button>
        </div>
      </div>
    </OrderLayout>
  );
}
