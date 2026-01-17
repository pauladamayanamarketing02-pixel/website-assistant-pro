import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskStatus = "pending" | "assigned" | "in_progress" | "ready_for_review" | "completed";

type TaskRow = {
  id: string;
  businessName: string;
  title: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
};

const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  completed: "Completed",
};

export default function AdminTasks() {
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const tasks: TaskRow[] = useMemo(
    () => [
      {
        id: "t-1001",
        businessName: "Acme Coffee",
        title: "Write Instagram captions for weekly promo",
        assignee: "Sarah Kim",
        deadline: "2026-01-22",
        status: "in_progress",
      },
      {
        id: "t-1002",
        businessName: "Bright Dental",
        title: "Draft blog post: Teeth Whitening Tips",
        assignee: "John Doe",
        deadline: "2026-01-25",
        status: "ready_for_review",
      },
      {
        id: "t-1003",
        businessName: "Nova Fitness",
        title: "Set up weekly email campaign",
        assignee: "Unassigned",
        deadline: "2026-01-28",
        status: "pending",
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">View and manage tasks across all businesses.</p>
        </div>

        <Button type="button" onClick={() => {}}>
          <Plus className="h-4 w-4" />
          Add New Tasks
        </Button>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Task Management</CardTitle>
              <p className="text-sm text-muted-foreground">Filter tasks by status and review details.</p>
            </div>

            <div className="w-full sm:w-[220px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Task Title</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No tasks match the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.id}</TableCell>
                    <TableCell>{t.businessName}</TableCell>
                    <TableCell className="text-muted-foreground">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.assignee}</TableCell>
                    <TableCell className="text-muted-foreground">{t.deadline}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{statusLabel[t.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => {}}>
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
