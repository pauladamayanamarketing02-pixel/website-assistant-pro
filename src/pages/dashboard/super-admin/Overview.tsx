import { AlertTriangle, CheckCircle2, CreditCard, Server, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Overview() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Monitoring cepat indikator besar sistem & bisnis.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">Rp 1.250.000.000</div>
            <div className="text-xs text-muted-foreground">(placeholder)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transaksi Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">128</div>
            <div className="text-xs text-muted-foreground">(placeholder)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">2.431</div>
            <div className="text-xs text-muted-foreground">(last 24h, placeholder)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assist Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">87</div>
            <div className="text-xs text-muted-foreground">(last 24h, placeholder)</div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Payment</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                OK
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Server</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                OK
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">API</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                OK
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Status di atas masih placeholder; nanti disambungkan ke monitoring & healthcheck.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alert Penting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Gagal bayar meningkat</div>
                <div className="text-xs text-muted-foreground">12 transaksi gagal dalam 60 menit terakhir (placeholder)</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Refund pending</div>
                <div className="text-xs text-muted-foreground">4 refund menunggu approval (placeholder)</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Super Admin fokus pada indikator besar, bukan operasional harian.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
