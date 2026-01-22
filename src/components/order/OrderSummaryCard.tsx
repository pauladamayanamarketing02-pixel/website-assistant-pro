import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrder } from "@/contexts/OrderContext";
import { useOrderPublicSettings } from "@/hooks/useOrderPublicSettings";

export function OrderSummaryCard({ showEstPrice = true }: { showEstPrice?: boolean }) {
  const { state } = useOrder();
  const { pricing, contact } = useOrderPublicSettings(state.domain);

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

  const domainPriceLabel = pricing.domainPriceUsd == null ? "—" : `$${pricing.domainPriceUsd.toFixed(2)}`;

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
          {showEstPrice ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Est. Price</span>
              <span className="text-sm font-medium text-foreground">{domainPriceLabel}</span>
            </div>
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
