import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Security() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="text-muted-foreground">Login log, activity log, failed login attempts, IP allow/deny, session management, reset 2FA.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login Log</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: daftar login + IP + device.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: revoke session, reset 2FA, whitelist/blacklist.</CardContent>
        </Card>
      </div>
    </div>
  );
}
