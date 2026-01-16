import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminManagement() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Admin Management</h1>
        <p className="text-muted-foreground">Tambah / edit / nonaktifkan admin, atur role internal, dan kontrol akses.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akun Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Placeholder list admin (support / ops / manager).</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Tambah Admin</Button>
              <Button size="sm" variant="secondary">Edit Admin</Button>
              <Button size="sm" variant="outline">Nonaktifkan</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontrol Akses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Reset akses, force logout admin, dan rotasi session (placeholder).</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">Reset Akses</Button>
              <Button size="sm" variant="destructive">Force Logout Admin</Button>
            </div>
            <p className="text-xs text-muted-foreground">Nantinya aksi ini wajib tercatat di Audit Log.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
