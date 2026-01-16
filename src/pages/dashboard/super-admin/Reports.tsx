import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Revenue report, growth user, retention, assist performance (high-level).</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analitik</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Placeholder: chart & export laporan.</CardContent>
      </Card>
    </div>
  );
}
