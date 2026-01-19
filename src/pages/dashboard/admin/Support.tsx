import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, CheckCircle2, Send } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type InquiryStatus = "new" | "resolved" | "all" | (string & {});

type InquiryRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  source: string;
};

type SupportSource = "contact" | "business_support" | "assistant_support";

type SupportQuickFormProps = {
  title: string;
  description: string;
  source: SupportSource;
  onCreated: () => void;
};

function formatDateTime(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = String(status ?? "").toLowerCase();
  if (s === "resolved" || s === "done" || s === "closed") return "secondary";
  if (s === "new" || s === "open" || s === "unread") return "default";
  return "outline";
}

function SupportQuickCreateForm({ title, description, source, onCreated }: SupportQuickFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = name.trim() && email.trim() && subject.trim() && message.trim();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const { error } = await (supabase as any)
        .from("website_inquiries")
        .insert({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          status: "new",
          source,
        });

      if (error) throw error;

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");

      toast({
        title: "Submitted",
        description: "Your support message has been added to the inbox.",
      });

      onCreated();
    } catch (err) {
      console.error("Error creating support message:", err);
      toast({
        title: "Failed",
        description: "Could not submit the message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${source}-name`}>Name</Label>
              <Input id={`${source}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${source}-email`}>Email</Label>
              <Input
                id={`${source}-email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${source}-subject`}>Subject</Label>
              <Input
                id={`${source}-subject`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${source}-message`}>Message</Label>
              <Textarea
                id={`${source}-message`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the message…"
                rows={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
            <Send className="h-4 w-4" />
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminSupport() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus>("all");
  const [selected, setSelected] = useState<InquiryRow | null>(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from("website_inquiries")
        .select("id, created_at, name, email, subject, message, status, source")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = ((data as any[]) ?? []).map((x) => ({
        id: String(x.id),
        created_at: String(x.created_at),
        name: String(x.name ?? ""),
        email: String(x.email ?? ""),
        subject: String(x.subject ?? ""),
        message: String(x.message ?? ""),
        status: String(x.status ?? "new"),
        source: String(x.source ?? "contact"),
      })) as InquiryRow[];

      setRows(list);
    } catch (e) {
      console.error("Error fetching inquiries:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInquiries();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    const needle = String(statusFilter).toLowerCase();
    return rows.filter((r) => String(r.status).toLowerCase() === needle);
  }, [rows, statusFilter]);

  const markResolved = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("website_inquiries").update({ status: "resolved" }).eq("id", id);
      if (error) throw error;

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)));
      setSelected((prev) => (prev?.id === id ? { ...prev, status: "resolved" } : prev));

      toast({ title: "Updated", description: "Marked as resolved." });
    } catch (e) {
      console.error("Error updating inquiry status:", e);
      toast({
        title: "Failed",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Website Inquiries</h1>
          <p className="text-sm text-muted-foreground">All messages submitted from the website contact form.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[220px]">
            <Select value={String(statusFilter)} onValueChange={(v) => setStatusFilter(v as InquiryStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={fetchInquiries}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <Card className="lg:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Website Inquiries</CardTitle>
            <p className="text-sm text-muted-foreground">Click “View” to open details and mark as resolved.</p>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-sm text-muted-foreground">Loading inquiries...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Received</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No inquiries.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email}</TableCell>
                        <TableCell className="text-muted-foreground">{r.subject}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Inquiry Details</DialogTitle>
                                <DialogDescription>
                                  {r.email} • {formatDateTime(r.created_at)} • source: {r.source}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                  <div className="text-sm font-medium text-foreground">Subject</div>
                                  <div className="text-sm text-muted-foreground">{r.subject}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <div className="text-sm font-medium text-foreground">Message</div>
                                  <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground">
                                    {r.message}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-foreground">Status:</div>
                                  <Badge variant={statusBadgeVariant(selected?.status ?? r.status)}>
                                    {selected?.id === r.id ? selected.status : r.status}
                                  </Badge>
                                </div>
                              </div>

                              <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() => markResolved(r.id)}
                                  disabled={
                                    String((selected?.id === r.id ? selected.status : r.status)).toLowerCase() ===
                                    "resolved"
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Mark Resolved
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <SupportQuickCreateForm
          title="Business Support"
          description="Create a support message on behalf of a business account."
          source="business_support"
          onCreated={fetchInquiries}
        />

        <SupportQuickCreateForm
          title="Assistant Support"
          description="Create a support message on behalf of an assistant account."
          source="assistant_support"
          onCreated={fetchInquiries}
        />
      </div>
    </div>
  );
}
