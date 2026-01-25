import { useEffect, useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
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

type TaskStatus = "pending" | "assigned" | "in_progress" | "ready_for_review" | "completed" | "cancelled";

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
  cancelled: "Cancelled",
};

const toTaskStatus = (status: unknown): TaskStatus => {
  const s = String(status ?? "pending") as TaskStatus;
  if (s === "pending") return "pending";
  if (s === "assigned") return "assigned";
  if (s === "in_progress") return "in_progress";
  if (s === "ready_for_review") return "ready_for_review";
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancelled";
  return "pending";
};

export default function AdminTasks() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const { data: tasks, error } = await (supabase as any)
        .from("tasks")
        .select("id, task_number, user_id, assigned_to, title, deadline, status")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const taskList = (tasks as any[]) ?? [];
      if (taskList.length === 0) {
        setRows([]);
        return;
      }

      const userIds = Array.from(new Set(taskList.map((t) => t.user_id).filter(Boolean)));
      const assigneeIds = Array.from(new Set(taskList.map((t) => t.assigned_to).filter(Boolean)));

      const [{ data: businesses, error: businessesError }, { data: assignees, error: assigneesError }] = await Promise.all([
        (supabase as any).from("businesses").select("user_id, business_name").in("user_id", userIds),
        assigneeIds.length
          ? (supabase as any).from("profiles").select("id, name").in("id", assigneeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (businessesError) throw businessesError;
      if (assigneesError) throw assigneesError;

      const businessByUserId = new Map<string, string>();
      ((businesses as any[]) ?? []).forEach((b) => {
        if (b?.user_id) businessByUserId.set(b.user_id, b?.business_name || "—");
      });

      const assigneeById = new Map<string, string>();
      ((assignees as any[]) ?? []).forEach((a) => {
        if (a?.id) assigneeById.set(a.id, a?.name || "—");
      });

      const nextRows: TaskRow[] = taskList.map((t) => {
        const taskNumber = t?.task_number;
        const label = taskNumber ? `T-${String(taskNumber).padStart(4, "0")}` : String(t.id);

        return {
          id: label,
          businessName: businessByUserId.get(t.user_id) ?? "—",
          title: t.title ?? "—",
          assignee: t.assigned_to ? assigneeById.get(t.assigned_to) ?? "—" : "Unassigned",
          deadline: t.deadline ? String(t.deadline).slice(0, 10) : "—",
          status: toTaskStatus(t.status),
        };
      });

      setRows(nextRows);
    } catch (e) {
      console.error("Error fetching tasks:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((t) => t.status === statusFilter);
  }, [rows, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">View and manage tasks across all businesses.</p>
        </div>

        <Button type="button" onClick={() => navigate("/dashboard/admin/tasks/new")}>
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
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading tasks...</div>
          ) : (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/admin/tasks/${t.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
