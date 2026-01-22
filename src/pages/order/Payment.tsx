import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, setPromoCode } = useOrder();
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [promo, setPromo] = useState(state.promoCode);

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
                onClick={() => {
                  setPromoCode(promo.trim());
                  toast({ title: "Promo code saved", description: promo.trim() ? `Code: ${promo.trim()}` : "Cleared" });
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
              toast({ title: "Order completed", description: "Terima kasih! Order Anda sudah kami terima." });
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
