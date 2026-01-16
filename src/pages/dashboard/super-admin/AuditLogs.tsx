import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditLogs() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground">Semua aktivitas sensitif (tidak bisa dihapus): perubahan harga, refund, login admin, dll.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Aktivitas Sensitif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Placeholder: tabel log + filter (user/waktu/aksi) + export.</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">Filter</Button>
            <Button size="sm" variant="secondary">Export</Button>
          </div>
          <p className="text-xs text-muted-foreground">Catatan: UI tidak menyediakan aksi hapus log.</p>
        </CardContent>
      </Card>
    </div>
  );
}
