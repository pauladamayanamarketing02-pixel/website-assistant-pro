import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">General settings, notifikasi, integrasi API, maintenance mode, dll.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: konfigurasi umum aplikasi.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Mode</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder: toggle maintenance (sebaiknya via environment/server-side, bukan UI).
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
