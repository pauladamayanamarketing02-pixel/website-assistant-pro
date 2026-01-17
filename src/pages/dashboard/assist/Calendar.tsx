import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssistCalendar() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">Plan deadlines, content schedules, and reminders.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          This will display a calendar view for tasks and content planning.
        </CardContent>
      </Card>
    </div>
  );
}
