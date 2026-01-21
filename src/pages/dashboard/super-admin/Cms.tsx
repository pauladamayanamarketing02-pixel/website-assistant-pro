import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminCms() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CMS</h1>
        <p className="text-muted-foreground">Manage website content modules from one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blog</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Central place for blog posts, categories, tags, and publishing settings.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website Pages</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Homepage, Services, FAQs, Contact, Media, and Layout settings.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
