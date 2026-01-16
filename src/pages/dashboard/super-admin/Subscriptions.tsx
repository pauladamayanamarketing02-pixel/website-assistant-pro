import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-muted-foreground">Status langganan user, renewal, upgrade/downgrade, grace period, cancel.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Placeholder: daftar subscription dan kontrol billing.
        </CardContent>
      </Card>
    </div>
  );
}
