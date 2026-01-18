import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AssistantRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  assistId: string;
};

export default function AdminAssistants() {
  const [rows, setRows] = useState<AssistantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAssistants();
  }, []);

  const formatAssistId = (userId: string) => {
    const idNum = (parseInt(userId.slice(-4), 16) % 900) + 100;
    return `A${String(idNum).padStart(5, "0")}`;
  };

  const fetchAssistants = async () => {
    try {
      setLoading(true);

      const { data: assistRoles, error: rolesError } = await (supabase as any)
        .from("user_roles")
        .select("user_id")
        .eq("role", "assist");

      if (rolesError) throw rolesError;

      const assistIds = (assistRoles as any[])?.map((r) => r.user_id) ?? [];

      if (assistIds.length === 0) {
        setRows([]);
        return;
      }

      const { data: profiles, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("id, name, email, phone, country")
        .in("id", assistIds)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const nextRows: AssistantRow[] = ((profiles as any[]) ?? []).map((p) => ({
        ...p,
        assistId: formatAssistId(p.id),
      }));

      setRows(nextRows);
    } catch (error) {
      console.error("Error fetching assistants:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Assistants</h1>
          <p className="text-sm text-muted-foreground">
            View and manage marketing assistant accounts.
          </p>
        </div>

        <Button type="button" onClick={() => {}}>
          <Plus className="h-4 w-4" />
          Add New Assistant
        </Button>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Assistant Accounts</CardTitle>
          <p className="text-xs text-muted-foreground">
            This list shows users with the <span className="font-medium">assist</span> role.
          </p>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading assistants...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistant ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No assistants found.
                    </TableCell>
                  </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.assistId}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground">{row.email}</TableCell>
                        <TableCell className="text-muted-foreground">{row.phone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.country ?? "—"}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
