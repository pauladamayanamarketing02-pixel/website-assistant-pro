import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TaskStatus = "pending" | "assigned" | "in_progress" | "ready_for_review" | "completed";

const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  completed: "Completed",
};

const toTaskStatus = (status: unknown): TaskStatus => {
  const s = String(status ?? "pending") as TaskStatus;
  if (s === "pending") return "pending";
  if (s === "assigned") return "assigned";
  if (s === "in_progress") return "in_progress";
  if (s === "ready_for_review") return "ready_for_review";
  if (s === "completed") return "completed";
  return "pending";
};

function parseTaskNumberFromLabel(label: string | undefined | null): number | null {
  if (!label) return null;
  const raw = label.trim().toUpperCase();
  // Accept: T-0001 or T0001
  const m = raw.match(/^T-?(\d{1,})$/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

export default function AdminTaskDetails() {
  const navigate = useNavigate();
  const { taskNumberLabel } = useParams();
  const taskNumber = useMemo(() => parseTaskNumberFromLabel(taskNumberLabel), [taskNumberLabel]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<any | null>(null);
  const [businessName, setBusinessName] = useState<string>("—");
  const [assigneeName, setAssigneeName] = useState<string>("—");

  useEffect(() => {
    const run = async () => {
      if (!taskNumber) {
        setError("Invalid Task ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: t, error: tErr } = await (supabase as any)
          .from("tasks")
          .select("id, task_number, user_id, assigned_to, title, description, deadline, status, created_at")
          .eq("task_number", taskNumber)
          .maybeSingle();

        if (tErr) throw tErr;
        if (!t) {
          setError("Task not found");
          return;
        }

        setTask(t);

        const userId = t.user_id as string | undefined;
        const assigneeId = t.assigned_to as string | undefined;

        const [{ data: businesses }, { data: assignees }] = await Promise.all([
          userId
            ? (supabase as any).from("businesses").select("user_id, business_name").eq("user_id", userId).maybeSingle()
            : Promise.resolve({ data: null }),
          assigneeId
            ? (supabase as any).from("profiles").select("id, name").eq("id", assigneeId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        setBusinessName(String((businesses as any)?.business_name ?? "—"));
        setAssigneeName(String((assignees as any)?.name ?? (assigneeId ? "—" : "Unassigned")));
      } catch (e: any) {
        console.error("Error loading task details:", e);
        setError(e?.message ?? "Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [taskNumber]);

  const label = taskNumber ? `T-${String(taskNumber).padStart(4, "0")}` : String(taskNumberLabel ?? "");
  const status = toTaskStatus(task?.status);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Task Details</h1>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/admin/tasks")}>Back</Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Overview</CardTitle>
          <Badge variant="secondary">{statusLabel[status]}</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="py-8 text-sm text-muted-foreground">{error}</div>
          ) : (
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Business Name</dt>
                <dd className="mt-1 font-medium text-foreground">{businessName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assignee</dt>
                <dd className="mt-1 font-medium text-foreground">{assigneeName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Title</dt>
                <dd className="mt-1 font-medium text-foreground">{task?.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Deadline</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {task?.deadline ? String(task.deadline).slice(0, 10) : "—"}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-muted-foreground">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">{task?.description ?? "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
