import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainSearchBar } from "@/components/order/DomainSearchBar";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";

type DomainStatus = "unknown";

function badgeVariant(_status: DomainStatus) {
  return "secondary" as const;
}

export default function ChooseDomain() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("domain") ?? "";
  const { state, setDomain, setDomainStatus } = useOrder();
  const [lastChecked, setLastChecked] = useState<string>(state.domain || initial);

  // Domain lookup integration removed from this page.
  // We only collect the domain text and continue.
  const status: DomainStatus | null = lastChecked ? "unknown" : null;
  const canContinue = Boolean(lastChecked);

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
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant(status ?? "unknown")}>{status ?? "unknown"}</Badge>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              )}
            </div>
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
                setDomainStatus(null);
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
