import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssistMediaLibrary() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
        <p className="text-muted-foreground">Browse and manage uploaded media assets.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          Upload, preview, copy URLs, and organize media for each client.
        </CardContent>
      </Card>
    </div>
  );
}
