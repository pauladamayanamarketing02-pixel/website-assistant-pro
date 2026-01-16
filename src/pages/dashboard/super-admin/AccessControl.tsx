import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessControl() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Access Control</h1>
        <p className="text-muted-foreground">Kelola role, permission, mapping menu ke role, dan preview akses.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role & Permission</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Placeholder: editor permission + preview akses (super_admin / admin roles: support, ops, manager).
        </CardContent>
      </Card>
    </div>
  );
}
