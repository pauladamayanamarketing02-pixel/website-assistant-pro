import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";
import { useOrderPublicSettings } from "@/hooks/useOrderPublicSettings";
import { validatePromoCode } from "@/hooks/useOrderPromoCode";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, setPromoCode, setAppliedPromo } = useOrder();
  const { pricing, subscriptionPlans } = useOrderPublicSettings(state.domain);
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [promo, setPromo] = useState(state.promoCode);

  const baseTotalUsd = useMemo(() => {
    if (!state.subscriptionYears) return null;
    const selectedPlan = subscriptionPlans.find((p) => p.years === state.subscriptionYears);
    const planOverrideUsd =
      typeof selectedPlan?.price_usd === "number" && Number.isFinite(selectedPlan.price_usd) ? selectedPlan.price_usd : null;
    if (planOverrideUsd != null) return planOverrideUsd;
    const domainUsd = pricing.domainPriceUsd ?? null;
    const pkgUsd = pricing.packagePriceUsd ?? null;
    if (domainUsd == null || pkgUsd == null) return null;
    return (domainUsd + pkgUsd) * state.subscriptionYears;
  }, [pricing.domainPriceUsd, pricing.packagePriceUsd, state.subscriptionYears, subscriptionPlans]);

  // Auto-apply promo as user types (debounced), so Est. price updates immediately.
  useEffect(() => {
    const code = promo.trim();
    setPromoCode(code);

    // Clear applied promo while typing / when empty
    if (!code || baseTotalUsd == null) {
      setAppliedPromo(null);
      return;
    }

    const t = window.setTimeout(async () => {
      const res = await validatePromoCode(code, baseTotalUsd);
      if (!res.ok) {
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({
        id: res.promo.id,
        code: res.promo.code,
        promoName: res.promo.promo_name,
        discountUsd: res.discountUsd,
      });
    }, 450);

    return () => window.clearTimeout(t);
  }, [baseTotalUsd, promo, setAppliedPromo, setPromoCode]);

  const canComplete = useMemo(() => {
    return Boolean(
      state.domain &&
        state.selectedTemplateId &&
        state.subscriptionYears &&
        state.details.email &&
        state.details.acceptedTerms,
    );
  }, [state.details.acceptedTerms, state.details.email, state.domain, state.selectedTemplateId, state.subscriptionYears]);

  return (
    <OrderLayout title="Payment" step="payment" sidebar={<OrderSummaryCard />}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={method === "card" ? "default" : "outline"} onClick={() => setMethod("card")}>
                Card
              </Button>
              <Button type="button" variant={method === "bank" ? "default" : "outline"} onClick={() => setMethod("bank")}>
                Bank transfer
              </Button>
            </div>

            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              This is a placeholder checkout. We can connect Stripe later when you’re ready.
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo code" />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const code = promo.trim();
                  setPromoCode(code);
                  if (!code) {
                    setAppliedPromo(null);
                    toast({ title: "Promo cleared" });
                    return;
                  }
                  if (baseTotalUsd == null) {
                    setAppliedPromo(null);
                      toast({ variant: "destructive", title: "Unable to apply promo", description: "The total amount is not available yet." });
                    return;
                  }

                  const res = await validatePromoCode(code, baseTotalUsd);
                  if (!res.ok) {
                    setAppliedPromo(null);
                      toast({ variant: "destructive", title: "Invalid promo code", description: "The promo code was not found or is not active." });
                    return;
                  }

                  setAppliedPromo({
                    id: res.promo.id,
                    code: res.promo.code,
                    promoName: res.promo.promo_name,
                    discountUsd: res.discountUsd,
                  });
                  toast({ title: "Promo applied", description: `${res.promo.promo_name} (-$${res.discountUsd.toFixed(2)})` });
                }}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Final review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please review your domain, chosen design, and details in the Order Summary.
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/order/subscription")}>
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!canComplete}
            onClick={() => {
              toast({ title: "Order completed", description: "Thank you. Your order has been received." });
              navigate("/order/payment", { replace: true });
            }}
          >
            Complete Purchase
          </Button>
        </div>
      </div>
    </OrderLayout>
  );
}
