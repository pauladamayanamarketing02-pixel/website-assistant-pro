import { CalendarDays, Lightbulb, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContentPlanner() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          Content Planner
        </h1>
        <p className="text-muted-foreground">
          Plan your content ideas, schedule posts, and keep everything organized.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Quick Ideas
            </CardTitle>
            <CardDescription>Draft a few content ideas to use later.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This section will become your idea bank (topics, hooks, captions, and post angles).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Next Steps
            </CardTitle>
            <CardDescription>What you can do next in this feature.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Create content items (title, platform, due date)</li>
              <li>Attach assets from My Gallery</li>
              <li>Send drafts to Assist for review</li>
            </ul>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
