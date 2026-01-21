import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

type RoleRow = {
  user_id: string;
  role: string;
};

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  account_status?: string;
};

type AccountRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  account_status: string;
};

type SortKey = "name" | "email" | "role" | "account_status";
type SortDir = "asc" | "desc";

export default function SuperAdminUsersAssists() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AccountRow[]>([]);

  const [sortKey, setSortKey] = useState<SortKey>("role");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("id,name,email,account_status").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const roleByUserId = new Map<string, string>();
      (roles as RoleRow[] | null)?.forEach((r) => roleByUserId.set(String(r.user_id), String(r.role)));

      const mapped: AccountRow[] = ((profiles as ProfileRow[] | null) ?? []).map((p) => ({
        id: String(p.id),
        name: String(p.name ?? ""),
        email: String(p.email ?? ""),
        role: roleByUserId.get(String(p.id)) ?? "unknown",
        account_status: String((p as any).account_status ?? "active"),
      }));

      setRows(mapped);
    } catch (err) {
      console.error("Error fetching users/assists:", err);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.account_status.toLowerCase().includes(q)
    );
  }, [query, rows]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, sortDir, sortKey]);

  const toggleSort = (key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir("asc");
      return key;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users & Assists</h1>
          <p className="text-muted-foreground">View all user and assist accounts.</p>
        </div>

        <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Accounts</CardTitle>
          <div className="w-full sm:w-80">
            <Input placeholder="Search name, email, role..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading accounts...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("role")}
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      Role
                      {sortKey === "role" ? <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span> : null}
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="capitalize">{r.role.replace("_", " ")}</TableCell>
                      <TableCell className="capitalize">{r.account_status}</TableCell>
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
