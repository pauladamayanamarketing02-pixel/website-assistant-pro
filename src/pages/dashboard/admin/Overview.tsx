import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Operasional</h1>
        <p className="text-muted-foreground">
          Monitoring harian & aksi cepat (placeholder UI — data menyusul).
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User aktif hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Login terakhir 24 jam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assist aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Aktif hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task berjalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">In Progress / Assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task terlambat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">—</div>
            <p className="text-xs text-muted-foreground">Melewati deadline</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Laporan pending approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Belum ada data.</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Laporan dari assist menunggu review</li>
              <li>Butuh approve/reject sebelum dikirim ke user</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Komplain / Tiket Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Belum ada data.</div>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Komplain dari user/assist</li>
              <li>Tiket support yang belum resolved</li>
              <li>Escalation dari assist</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Menu utama untuk operasional harian:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Tasks</strong>: Assign/reassign, set deadline, prioritas</li>
              <li><strong>Assists</strong>: Verifikasi, assign ke user, monitoring workload</li>
              <li><strong>Reports</strong>: Review & approve laporan dari assist</li>
              <li><strong>Support</strong>: Tangani komplain & tiket</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
