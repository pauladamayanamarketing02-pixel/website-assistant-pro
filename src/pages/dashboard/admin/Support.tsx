import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type InquiryTableProps = {
  rows: InquiryRow[];
  emptyLabel: string;
  onOpen: (row: InquiryRow) => void;
  selected: InquiryRow | null;
  onMarkResolved: (id: string) => void;
};

function InquiryTable({ rows, emptyLabel, onOpen, selected, onMarkResolved }: InquiryTableProps) {
  return (
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
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              {emptyLabel}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => (
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
                    <Button variant="outline" size="sm" onClick={() => onOpen(r)}>
                      <Eye className="h-4 w-4" />
                      Read
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
                        onClick={() => onMarkResolved(r.id)}
                        disabled={
                          String((selected?.id === r.id ? selected.status : r.status)).toLowerCase() === "resolved"
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
  );
}

export default function AdminSupport() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus>("all");
  const [selected, setSelected] = useState<InquiryRow | null>(null);
  const [tab, setTab] = useState<"public" | "business" | "assistant">("public");

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

    // Keep ticket lists up to date (so Tickets Business reflects /dashboard/user/support immediately)
    const channel = supabase
      .channel("admin-support-tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "website_inquiries" },
        () => void fetchInquiries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    const needle = String(statusFilter).toLowerCase();
    return rows.filter((r) => String(r.status).toLowerCase() === needle);
  }, [rows, statusFilter]);

  const ticketsPublic = useMemo(() => {
    const blocked = new Set(["business_support", "assistant_support"]);
    return filtered.filter((r) => !blocked.has(String(r.source).toLowerCase()));
  }, [filtered]);

  const ticketsBusiness = useMemo(() => {
    return filtered.filter((r) => String(r.source).toLowerCase() === "business_support");
  }, [filtered]);

  const ticketsAssistant = useMemo(() => {
    return filtered.filter((r) => String(r.source).toLowerCase() === "assistant_support");
  }, [filtered]);

  const newCounts = useMemo(() => {
    const isNew = (r: InquiryRow) => String(r.status ?? "").toLowerCase() === "new";
    const isBusiness = (r: InquiryRow) => String(r.source ?? "").toLowerCase() === "business_support";
    const isAssistant = (r: InquiryRow) => String(r.source ?? "").toLowerCase() === "assistant_support";
    const isPublic = (r: InquiryRow) => !isBusiness(r) && !isAssistant(r);

    const publicCount = rows.filter((r) => isNew(r) && isPublic(r)).length;
    const businessCount = rows.filter((r) => isNew(r) && isBusiness(r)).length;
    const assistantCount = rows.filter((r) => isNew(r) && isAssistant(r)).length;

    return {
      public: publicCount,
      business: businessCount,
      assistant: assistantCount,
    };
  }, [rows]);

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
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Inbox for public + business + assistant support requests.
          </p>
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

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Tickets</CardTitle>
          <CardDescription>Filter by ticket type and status.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading inquiries...</div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList>
                <TabsTrigger value="public" className="gap-2">
                  <span>Tickets Public</span>
                  {newCounts.public > 0 ? <Badge variant="default">{newCounts.public}</Badge> : null}
                </TabsTrigger>
                <TabsTrigger value="business" className="gap-2">
                  <span>Tickets Business</span>
                  {newCounts.business > 0 ? <Badge variant="default">{newCounts.business}</Badge> : null}
                </TabsTrigger>
                <TabsTrigger value="assistant" className="gap-2">
                  <span>Tickets Assistant</span>
                  {newCounts.assistant > 0 ? <Badge variant="default">{newCounts.assistant}</Badge> : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public" className="mt-4">
                <InquiryTable
                  rows={ticketsPublic}
                  emptyLabel="No public tickets."
                  onOpen={setSelected}
                  selected={selected}
                  onMarkResolved={markResolved}
                />
              </TabsContent>

              <TabsContent value="business" className="mt-4">
                <InquiryTable
                  rows={ticketsBusiness}
                  emptyLabel="No business tickets."
                  onOpen={setSelected}
                  selected={selected}
                  onMarkResolved={markResolved}
                />
              </TabsContent>

              <TabsContent value="assistant" className="mt-4">
                <InquiryTable
                  rows={ticketsAssistant}
                  emptyLabel="No assistant tickets."
                  onOpen={setSelected}
                  selected={selected}
                  onMarkResolved={markResolved}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
