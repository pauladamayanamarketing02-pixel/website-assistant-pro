import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersAssists() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Users & Assists</h1>
        <p className="text-muted-foreground">Monitoring akun (read-only/terbatas): status, riwayat paket, aktivitas terakhir.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Placeholder: tabel user & assist (status akun, last activity, paket).</p>
          <p>Catatan: Super Admin tidak mengurus task, hanya monitoring high-level.</p>
        </CardContent>
      </Card>
    </div>
  );
}
