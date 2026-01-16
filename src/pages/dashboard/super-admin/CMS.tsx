import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CMS() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">CMS</h1>
        <p className="text-muted-foreground">Blog, halaman layanan, SEO settings (opsional).</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blog</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: CRUD artikel blog.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Placeholder: title/meta/canonical per page.</CardContent>
        </Card>
      </div>
    </div>
  );
}
