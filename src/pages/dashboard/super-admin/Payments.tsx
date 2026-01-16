import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Payments() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">Transaksi masuk, status pembayaran, refund, settlement, invoice, fee & komisi.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaksi Masuk</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: daftar transaksi + filter status.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refund / Settlement</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: proses refund + settlement + invoice.</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log (Wajib)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Semua aksi sensitif di menu Payments wajib tercatat di Audit Logs (belum diimplementasikan).
        </CardContent>
      </Card>
    </div>
  );
}
