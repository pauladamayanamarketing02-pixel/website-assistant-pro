import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Halaman ini masih placeholder. Nanti kita isi sesuai spesifikasi menu Super Admin.
        </CardContent>
      </Card>
    </div>
  );
}
