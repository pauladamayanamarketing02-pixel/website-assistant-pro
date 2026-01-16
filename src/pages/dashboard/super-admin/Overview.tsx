import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminOverview() {
  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitoring cepat kondisi sistem & bisnis (placeholder UI — data menyusul).
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Akan diisi dari data pembayaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Transaksi hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Masuk / sukses / gagal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Aktif 7 hari terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assist aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Aktif 7 hari terakhir</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">—</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Server</span>
              <span className="font-medium">—</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API</span>
              <span className="font-medium">—</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alert penting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Belum ada data.</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Gagal bayar</li>
              <li>Refund pending</li>
              <li>Anomali API</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
