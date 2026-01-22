import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainSearchBar } from "@/components/order/DomainSearchBar";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";
import { useDomainrCheck, type DomainrItem, type DomainrUiStatus } from "@/hooks/useDomainrCheck";

type DomainStatus = "available" | "unavailable" | "premium" | "unknown";
type OrderDomainStatus = Exclude<DomainrUiStatus, "unknown">;

function formatPrice(item: DomainrItem) {
  if (!item.price_usd || !item.currency) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency }).format(item.price_usd);
}

function badgeVariant(status: DomainStatus) {
  if (status === "available") return "secondary";
  if (status === "premium") return "default";
  if (status === "unavailable") return "outline";
  return "secondary";
}

function toOrderStatus(status: DomainrUiStatus): OrderDomainStatus | null {
  if (status === "unknown") return null;
  return status;
}

export default function ChooseDomain() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("domain") ?? "";
  const { state, setDomain, setDomainStatus } = useOrder();
  const [lastChecked, setLastChecked] = useState<string>(state.domain || initial);

  const { items, loading, error } = useDomainrCheck(lastChecked, { enabled: Boolean(lastChecked) });

  const selectedResult = useMemo(() => {
    if (!lastChecked) return null;
    return items.find((i) => i.domain.toLowerCase() === lastChecked.toLowerCase()) ?? null;
  }, [items, lastChecked]);

  const status: DomainStatus | null = selectedResult?.status ?? (lastChecked ? "unknown" : null);
  const canContinue = status === "available" || status === "premium";

  const alternatives = useMemo(() => {
    // Use server results for “real-time” alternatives.
    return items.filter((i) => i.domain.toLowerCase() !== lastChecked.toLowerCase()).slice(0, 8);
  }, [items, lastChecked]);

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
              {!lastChecked ? (
                <span className="text-sm text-muted-foreground">Search to check availability</span>
              ) : loading ? (
                <span className="text-sm text-muted-foreground">Checking…</span>
              ) : error ? (
                <span className="text-sm text-destructive">{error}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant(status ?? "unknown")}>{status ?? "unknown"}</Badge>
                  <span className="text-sm text-muted-foreground">{selectedResult ? formatPrice(selectedResult) : "—"}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Smart alternatives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alternatives.length ? (
              <div className="grid gap-2">
                {alternatives.map((it) => (
                  <button
                    key={it.domain}
                    type="button"
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left hover:bg-muted/40"
                    onClick={() => {
                      setDomain(it.domain);
                      setDomainStatus(toOrderStatus(it.status));
                      setLastChecked(it.domain);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{it.domain}</div>
                      <div className="text-xs text-muted-foreground">{formatPrice(it)}</div>
                    </div>
                    <Badge variant={badgeVariant(it.status)}>{it.status}</Badge>
                  </button>
                ))}
              </div>
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
            onClick={() => {
              if (lastChecked) {
                setDomain(lastChecked);
                if (selectedResult) setDomainStatus(toOrderStatus(selectedResult.status));
              }
              navigate("/order/choose-design");
            }}
          >
            Continue to Design
          </Button>
        </div>
      </div>
    </OrderLayout>
  );
}
