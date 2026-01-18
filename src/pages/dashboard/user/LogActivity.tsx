import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogActivity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Log Activity</h1>
        <p className="text-muted-foreground">Riwayat aktivitas pekerjaan dan perubahan terbaru.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Log activity akan tersedia segera.</p>
        </CardContent>
      </Card>
    </div>
  );
}
