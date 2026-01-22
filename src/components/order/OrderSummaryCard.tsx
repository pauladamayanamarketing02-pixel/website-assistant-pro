import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrder } from "@/contexts/OrderContext";

export function OrderSummaryCard() {
  const { state } = useOrder();

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
      </CardContent>
    </Card>
  );
}
