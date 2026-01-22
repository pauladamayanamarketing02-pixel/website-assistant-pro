import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrder } from "@/contexts/OrderContext";
import { useOrderPublicSettings } from "@/hooks/useOrderPublicSettings";

function formatUsd(value: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function SubscriptionPlan() {
  const navigate = useNavigate();
  const { state, setSubscriptionYears } = useOrder();
  const { pricing } = useOrderPublicSettings(state.domain);

  const baseAnnualUsd = useMemo(() => {
    const domain = pricing.domainPriceUsd ?? 0;
    const pkg = pricing.packagePriceUsd ?? 0;
    return domain + pkg;
  }, [pricing.domainPriceUsd, pricing.packagePriceUsd]);

  const options = useMemo(
    () =>
      ([1, 2, 3] as const).map((years) => ({
        years,
        totalUsd: baseAnnualUsd > 0 ? baseAnnualUsd * years : null,
      })),
    [baseAnnualUsd],
  );

  const selected = state.subscriptionYears;

  return (
    <OrderLayout title="Subscription Plan" step="plan" sidebar={<OrderSummaryCard />}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Choose plan duration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sudah termasuk biaya Domain, Hosting, dan Web Template.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {options.map((opt) => {
                const isSelected = selected === opt.years;
                return (
                  <button
                    key={opt.years}
                    type="button"
                    onClick={() => setSubscriptionYears(opt.years)}
                    className={cn(
                      "w-full rounded-xl border bg-card p-4 text-left shadow-soft transition",
                      isSelected
                        ? "ring-2 ring-ring bg-primary/5 shadow-md"
                        : "hover:bg-muted/30 hover:shadow",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">{opt.years} Tahun</p>
                        <p className="mt-1 text-sm text-muted-foreground">All-in (domain + hosting + template)</p>
                      </div>
                      {isSelected ? <Badge variant="secondary">Selected</Badge> : <Badge variant="outline">Plan</Badge>}
                    </div>

                    <div className="mt-4">
                      <p className="text-2xl font-bold text-foreground">
                        {opt.totalUsd == null ? "—" : formatUsd(opt.totalUsd)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Total untuk {opt.years} tahun</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {pricing.packagePriceUsd == null ? (
              <p className="text-xs text-muted-foreground">
                Catatan: harga hosting+template mengikuti <span className="font-medium text-foreground">Default Package</span> di
                Domain Tools.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/order/details")}>
            Back
          </Button>
          <Button type="button" size="lg" disabled={!selected} onClick={() => navigate("/order/payment")}>
            Continue to Payment
          </Button>
        </div>
      </div>
    </OrderLayout>
  );
}
