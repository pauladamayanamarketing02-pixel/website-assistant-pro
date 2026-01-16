import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAccount() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground">Ganti password, atur 2FA, riwayat login, security check.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: change password + setup 2FA.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login History</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: daftar login terakhir + IP/device.</CardContent>
        </Card>
      </div>
    </div>
  );
}
