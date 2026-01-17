import { FileText, PencilLine, Tags, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    title: "Article list",
    description: "Browse all posts, search, filter, and manage status.",
    icon: FileText,
    bullets: ["Search & filters", "Draft / published status", "Quick actions"],
  },
  {
    title: "Editor",
    description: "Create and edit content with a structured publishing workflow.",
    icon: PencilLine,
    bullets: ["Rich text content", "Featured image", "Preview before publish"],
  },
  {
    title: "Categories & tags",
    description: "Organize content for SEO and navigation.",
    icon: Tags,
    bullets: ["Create categories", "Manage tags", "Avoid duplicates"],
  },
  {
    title: "Publish",
    description: "Control when and how a post goes live on the main website.",
    icon: UploadCloud,
    bullets: ["Publish / unpublish", "Schedule (optional)", "Audit trail (optional)"],
  },
];

export default function AdminWebsiteBlog() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Website Blog</h1>
        <p className="text-sm text-muted-foreground">
          Admin area to manage the main website blog (articles, categories, tags, and publishing).
        </p>
      </header>

      <Separator />

      <section className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <f.icon className="h-5 w-5" />
                <CardTitle className="text-base">{f.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {f.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div>
                <Button variant="secondary" size="sm" disabled>
                  Coming soon
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next step</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div>
            If you want this page to be functional (not just content), tell me the workflow you want:
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Do admins create posts here, or assistants write and admins approve?</li>
            <li>Fields needed: title, slug, content, excerpt, cover image, author, status.</li>
            <li>Publish rules: immediate, scheduled, or approval required.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
