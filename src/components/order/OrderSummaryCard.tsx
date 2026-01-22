import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrder } from "@/contexts/OrderContext";
import { useOrderPublicSettings } from "@/hooks/useOrderPublicSettings";

export function OrderSummaryCard({ showEstPrice = true }: { showEstPrice?: boolean }) {
  const { state } = useOrder();
  const { pricing, contact, subscriptionPlans } = useOrderPublicSettings(state.domain);

  const formatUsd = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const whatsappHref = (() => {
    const phone = (contact.whatsapp_phone ?? "").replace(/\D/g, "");
    if (!phone) return null;
    const text = encodeURIComponent(contact.whatsapp_message || "Halo, saya mau tanya order...");
    return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
  })();

  const emailHref = (() => {
    const to = (contact.email ?? "").trim();
    if (!to) return null;
    return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}`;
  })();

  const yearsLabel = state.subscriptionYears ? `${state.subscriptionYears} tahun` : "—";

  const baseTotalUsd = (() => {
    if (!showEstPrice) return null;
    if (!state.subscriptionYears) return null;

    const selectedPlan = subscriptionPlans.find((p) => p.years === state.subscriptionYears);
    const planOverrideUsd =
      typeof selectedPlan?.price_usd === "number" && Number.isFinite(selectedPlan.price_usd) ? selectedPlan.price_usd : null;
    if (planOverrideUsd != null) return planOverrideUsd;

    const domainUsd = pricing.domainPriceUsd ?? null;
    const pkgUsd = pricing.packagePriceUsd ?? null;
    if (domainUsd == null || pkgUsd == null) return null;

    return (domainUsd + pkgUsd) * state.subscriptionYears;
  })();

  const promoDiscountUsd = (() => {
    const d = state.appliedPromo?.discountUsd ?? 0;
    if (!Number.isFinite(d) || d <= 0) return 0;
    return d;
  })();

  const totalAfterPromoUsd = (() => {
    if (baseTotalUsd == null) return null;
    return Math.max(0, baseTotalUsd - promoDiscountUsd);
  })();

  const estTotalLabel = (() => {
    if (!showEstPrice) return null;
    if (totalAfterPromoUsd == null) return "—";
    return formatUsd(totalAfterPromoUsd);
  })();

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Domain</span>
            <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
              {state.domain || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-medium text-foreground">{yearsLabel}</span>
          </div>

          {showEstPrice ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-medium text-foreground">{estTotalLabel}</span>
              </div>
              {state.appliedPromo ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Promo</span>
                  <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
                    {state.appliedPromo.code} (-{formatUsd(promoDiscountUsd)})
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm">
              {state.domainStatus ? (
                <Badge variant={state.domainStatus === "available" ? "secondary" : "outline"}>
                  {state.domainStatus}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Template</span>
            <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
              {state.selectedTemplateName || "—"}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">What’s included</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Professional website design</li>
            <li>Mobile responsive layout</li>
            <li>Basic SEO setup</li>
          </ul>
        </div>

        {(whatsappHref || emailHref) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{contact.heading}</p>
              {contact.description ? <p className="text-sm text-muted-foreground">{contact.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                {whatsappHref ? (
                  <a className="text-sm underline text-foreground" href={whatsappHref} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                ) : null}
                {emailHref ? (
                  <a className="text-sm underline text-foreground" href={emailHref} target="_blank" rel="noreferrer">
                    Email
                  </a>
                ) : null}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
