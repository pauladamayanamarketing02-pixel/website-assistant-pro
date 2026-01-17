import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentCreation() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Content Creation</h1>
        <p className="text-muted-foreground">Create and manage content ideas for your clients.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          Add content briefs, generate ideas, and track approvals here.
        </CardContent>
      </Card>
    </div>
  );
}
