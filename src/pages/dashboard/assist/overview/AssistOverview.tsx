import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatStatus(status: string | null | undefined) {
  const s = String(status ?? '').trim().toLowerCase();
  if (!s) return { label: 'Unknown', variant: 'secondary' as const };
  if (s === 'active') return { label: 'Active', variant: 'default' as const };
  if (s === 'suspended') return { label: 'Suspended', variant: 'destructive' as const };
  if (s === 'pending') return { label: 'Pending', variant: 'secondary' as const };
  return { label: s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), variant: 'secondary' as const };
}

export default function AssistOverview(props: {
  accountStatus: string;
  activeClients: number;
  assignedTasks: number;
  unreadMessages: number;
}) {
  const status = formatStatus(props.accountStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assist Dashboard</h1>
        <p className="text-muted-foreground">Manage your clients and tasks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Current</div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{props.activeClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{props.assignedTasks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{props.unreadMessages}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
