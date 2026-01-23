import { useEffect, useMemo, useState } from "react";
import { Calendar, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminReportingTasksCard } from "@/components/dashboard/AdminReportingTasksCard";
import { supabase } from "@/integrations/supabase/client";

type BusinessOption = {
  id: string;
  user_id: string;
  business_name: string | null;
  business_number: number | null;
};

function formatBusinessId(n: number | null) {
  if (!n) return "—";
  return `B${String(n).padStart(5, "0")}`;
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("30");
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("all");
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const days = useMemo(() => {
    const n = Number.parseInt(dateRange, 10);
    return Number.isFinite(n) ? n : 30;
  }, [dateRange]);

  const selectedUserId = useMemo(() => {
    const b = businesses.find((x) => x.id === selectedBusinessId);
    return b?.user_id ?? null;
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    const load = async () => {
      setLoadingBusinesses(true);
      try {
        const { data, error } = await (supabase as any)
          .from("businesses")
          .select("id,user_id,business_name,business_number")
          .order("business_name", { ascending: true });

        if (error) throw error;
        setBusinesses(((data as any[]) ?? []).map((r) => ({
          id: String(r.id),
          user_id: String(r.user_id),
          business_name: r.business_name ?? null,
          business_number: r.business_number ?? null,
        })));
      } catch {
        setBusinesses([]);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Review completed tasks by business.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger className="w-[260px]" disabled={loadingBusinesses}>
              <SelectValue placeholder={loadingBusinesses ? "Loading businesses…" : "Select business"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select a business…</SelectItem>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.business_name || "(Unnamed business)"} · {formatBusinessId(b.business_number)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 1 year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <AdminReportingTasksCard days={days} userId={selectedUserId} />
    </div>
  );
}
