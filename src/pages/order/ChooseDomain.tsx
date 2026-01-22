import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainSearchBar } from "@/components/order/DomainSearchBar";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";
import { useDomainDuckCheck, type DomainDuckAvailability } from "@/hooks/useDomainDuckCheck";
import { useOrderPublicSettings } from "@/hooks/useOrderPublicSettings";

type DomainStatus = "available" | "unavailable" | "premium" | "blocked" | "unknown";

function badgeVariant(_status: DomainStatus) {
  return "secondary" as const;
}

function formatUsd(value: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function ChooseDomain() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("domain") ?? "";
  const { state, setDomain, setDomainStatus } = useOrder();
  const [lastChecked, setLastChecked] = useState<string>(state.domain || initial);

  const { loading, error, availability } = useDomainDuckCheck(lastChecked, { enabled: Boolean(lastChecked) });
  const { pricing } = useOrderPublicSettings(lastChecked);

  const status: DomainStatus | null = useMemo(() => {
    if (!lastChecked) return null;
    const a = availability as DomainDuckAvailability | null;
    if (!a) return loading ? "unknown" : "unknown";
    if (a === "true") return "available";
    if (a === "false") return "unavailable";
    if (a === "premium") return "premium";
    if (a === "blocked") return "blocked";
    return "unknown";
  }, [availability, lastChecked, loading]);

  useEffect(() => {
    // Persist to order context when we have a definitive status
    if (!status || status === "unknown") return;
    if (status === "available" || status === "unavailable" || status === "premium") {
      setDomainStatus(status);
    } else {
      setDomainStatus(null);
    }
  }, [setDomainStatus, status]);

  const canContinue = Boolean(lastChecked) && status !== "unavailable";

  return (
    <OrderLayout
      title="Choose Domain"
      step="domain"
      sidebar={<OrderSummaryCard showEstPrice={false} />}
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
          <CardContent className="space-y-3">
            {!lastChecked ? (
              <p className="text-sm text-muted-foreground">Search to check availability</p>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Domain</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-medium text-foreground">{lastChecked}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeVariant(status ?? "unknown")}>{
                              status === "available"
                                ? "Available"
                                : status === "unavailable"
                                  ? "Unavailable"
                                  : status === "premium"
                                    ? "Premium Domain"
                                    : status === "blocked"
                                      ? "Not Available"
                                      : loading
                                        ? "Checking…"
                                        : "Unknown"
                            }</Badge>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {pricing.domainPriceUsd == null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-col items-start">
                              <span className="text-base font-semibold text-foreground">
                                {formatUsd(pricing.domainPriceUsd)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatUsd(pricing.domainPriceUsd * 1.25)}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <p className="text-xs text-muted-foreground">
                  Powered by DomainDuck API. (WHOIS & RDAP tidak ditampilkan di Find Domain)
                </p>
              </>
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
