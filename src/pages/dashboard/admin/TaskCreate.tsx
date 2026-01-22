import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Client = {
  id: string;
  business_name: string;
};

type AssistAccount = {
  id: string;
  name: string;
};

type FormState = {
  title: string;
  description: string;
  type: string;
  platform: string;
  clientId: string;
  deadline: string;
  assignedTo: string;
  recurringMonthly: boolean;
};

export default function AdminTaskCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [assistAccounts, setAssistAccounts] = useState<AssistAccount[]>([]);
  const [nextTaskNumber, setNextTaskNumber] = useState(100);

  const [formData, setFormData] = useState<FormState>({
    title: "",
    description: "",
    type: "",
    platform: "",
    clientId: "",
    deadline: "",
    assignedTo: "",
    recurringMonthly: false,
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const taskIdLabel = useMemo(() => `T${String(nextTaskNumber).padStart(5, "0")}` , [nextTaskNumber]);

  useEffect(() => {
    void bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);

      const [clientsRes, maxRes, assistRes] = await Promise.all([
        (supabase as any)
          .from("businesses")
          .select("user_id, business_name")
          .not("business_name", "is", null)
          .order("business_name", { ascending: true }),
        (supabase as any)
          .from("tasks")
          .select("task_number")
          .order("task_number", { ascending: false })
          .limit(1),
        (supabase as any).rpc("get_assist_accounts"),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (maxRes.error) throw maxRes.error;
      if (assistRes.error) throw assistRes.error;

      const nextClients: Client[] = ((clientsRes.data as any[]) ?? [])
        .filter((x) => x?.user_id && x?.business_name)
        .map((x) => ({ id: String(x.user_id), business_name: String(x.business_name) }));

      const nextAssists: AssistAccount[] = ((assistRes.data as any[]) ?? [])
        .filter((x) => x?.id && x?.name)
        .map((x) => ({ id: String(x.id), name: String(x.name) }));

      const maxNum = Number((maxRes.data as any[])?.[0]?.task_number ?? 99);
      const safeMax = Number.isFinite(maxNum) ? maxNum : 99;

      setClients(nextClients);
      setAssistAccounts(nextAssists);
      setNextTaskNumber(safeMax + 1);
    } catch (e) {
      console.error("Error preparing task create form:", e);
      toast({
        title: "Failed",
        description: "Could not load task create form data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      platform: "",
      clientId: "",
      deadline: "",
      assignedTo: "",
      recurringMonthly: false,
    });
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    navigate("/dashboard/admin/tasks");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.clientId) {
      toast({
        title: "Missing required fields",
        description: "Client and Task Title are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.recurringMonthly && !formData.deadline) {
      toast({
        title: "Missing deadline",
        description: "Deadline is required for monthly recurring tasks.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      let fileUrl: string | null = null;

      if (uploadedFile) {
        const filePath = `${formData.clientId}/tasks/${Date.now()}-${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage.from("user-files").upload(filePath, uploadedFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      // Monthly recurring rule (auto-generate H-7 from chosen deadline day)
      if (formData.recurringMonthly) {
        const deadlineDay = Number.parseInt(formData.deadline.split("-")[2] || "", 10);
        if (!Number.isFinite(deadlineDay) || deadlineDay < 1 || deadlineDay > 31) {
          toast({
            title: "Invalid deadline",
            description: "Please choose a valid deadline date.",
            variant: "destructive",
          });
          return;
        }

        const { error: ruleErr } = await (supabase as any)
          .from("task_recurring_rules")
          .insert({
            created_by: user.id,
            user_id: formData.clientId,
            assigned_to: formData.assignedTo || null,
            title: formData.title.trim(),
            description: formData.description?.trim() ? formData.description.trim() : null,
            type: (formData.type as any) || null,
            platform: formData.type === "social_media" ? ((formData.platform as any) || null) : null,
            file_url: fileUrl,
            deadline_day: deadlineDay,
            is_active: true,
          });

        if (ruleErr) throw ruleErr;

        toast({
          title: "Recurring Task Enabled",
          description: "This task will auto-generate monthly (H-7 from the deadline).",
        });

        resetForm();
        return;
      }

      // One-time task
      const { error } = await (supabase as any)
        .from("tasks")
        .insert({
          user_id: formData.clientId,
          task_number: nextTaskNumber,
          title: formData.title.trim(),
          description: formData.description?.trim() ? formData.description.trim() : null,
          type: (formData.type as any) || null,
          platform: formData.type === "social_media" ? ((formData.platform as any) || null) : null,
          assigned_to: formData.assignedTo || null,
          deadline: formData.deadline || null,
          file_url: fileUrl,
          notes: null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Task Created",
        description: `Task ${taskIdLabel} has been created.`,
      });

      setNextTaskNumber((n) => n + 1);
      resetForm();
    } catch (e) {
      console.error("Error creating task:", e);
      toast({
        title: "Failed",
        description: "Failed to create task.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={resetForm}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground">Add a new task for a client</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Fill in the details for the new task</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Task ID</Label>
                  <Input value={taskIdLabel} disabled className="bg-muted font-mono" />
                  <p className="text-xs text-muted-foreground">Auto-generated task ID</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client * (Business Name)</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title..."
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value, platform: "" }))}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="email_marketing">Email Marketing</SelectItem>
                      <SelectItem value="ads">Ads</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "social_media" && (
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="x">X (Twitter)</SelectItem>
                        <SelectItem value="threads">Threads</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">{uploadedFile.name}</span>
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Click to upload file</span>
                  )}
                </div>
                <input ref={fileInputRef} id="task-file-upload" type="file" onChange={handleFileUpload} className="hidden" />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="deadline">Deadline</Label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Monthly</Label>
                      <Switch
                        checked={formData.recurringMonthly}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, recurringMonthly: checked }))
                        }
                      />
                    </div>
                  </div>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={formData.assignedTo || "__unassigned__"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: value === "__unassigned__" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Select assignee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {assistAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={creating}>
                  {creating ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
