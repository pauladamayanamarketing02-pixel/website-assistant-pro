import { useEffect, useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BusinessStatus = "active" | "pending" | "inactive" | "trial" | "expired" | "cancelled";

type BusinessPackage =
  | "starter"
  | "growth"
  | "pro"
  | "optimize"
  | "scale"
  | "dominate"
  | "custom";

type BusinessAccountRow = {
  userId: string;
  businessId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  status: BusinessStatus;
  package: BusinessPackage;
};

const statusLabel: Record<BusinessStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  trial: "Trial",
  expired: "Expired",
  cancelled: "Cancelled",
};

const mapDbStatusToUi = (status: unknown): BusinessStatus => {
  const s = String(status ?? "active").toLowerCase();
  if (s === "active") return "active";
  if (s === "pending") return "pending";
  if (s === "inactive") return "inactive";
  if (s === "trial") return "trial";
  if (s === "expired") return "expired";
  if (s === "cancelled") return "cancelled";
  return "active";
};

const mapDbPackageToUi = (pkgType: unknown): BusinessPackage => {
  const p = String(pkgType ?? "").toLowerCase();
  if (p === "starter") return "starter";
  if (p === "growth") return "growth";
  if (p === "pro") return "pro";
  // DB also has: website, monthly
  return "custom";
};

export default function AdminBusinessUsers() {
  const navigate = useNavigate();
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [rows, setRows] = useState<BusinessAccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchBusinessUsers();
  }, []);

  const fetchBusinessUsers = async () => {
    try {
      setLoading(true);

      // 1) get all user ids
      const { data: userRoles, error: rolesError } = await (supabase as any)
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");

      if (rolesError) throw rolesError;

      const userIds: string[] = ((userRoles as any[]) ?? []).map((r) => r.user_id).filter(Boolean);
      if (userIds.length === 0) {
        setRows([]);
        return;
      }

      // 2) fetch profiles for email/name/phone/status
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("id, name, email, phone, status")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // 3) fetch businesses for business_name + business_number
      const { data: businesses, error: businessesError } = await (supabase as any)
        .from("businesses")
        .select("id, user_id, business_name, business_number")
        .in("user_id", userIds);

      if (businessesError) throw businessesError;

      // 4) fetch active package per user (if any)
      const { data: userPackages, error: packagesError } = await (supabase as any)
        .from("user_packages")
        .select("user_id, status, package:packages(type)")
        .in("user_id", userIds);

      if (packagesError) throw packagesError;

      const businessByUserId = new Map<string, any>();
      (businesses as any[] | null)?.forEach((b) => {
        if (b?.user_id) businessByUserId.set(b.user_id, b);
      });

      const packageByUserId = new Map<string, BusinessPackage>();
      (userPackages as any[] | null)?.forEach((up) => {
        if (!up?.user_id) return;
        const pkgType = up?.package?.type;
        packageByUserId.set(up.user_id, mapDbPackageToUi(pkgType));
      });

      const nextRows: BusinessAccountRow[] = ((profiles as any[]) ?? []).map((p) => {
        const b = businessByUserId.get(p.id);
        const businessNumber = b?.business_number as number | null | undefined;
        const businessId = businessNumber ? `B${String(businessNumber).padStart(5, "0")}` : "—";

        return {
          userId: p.id,
          businessId,
          businessName: b?.business_name || "—",
          contactName: p?.name || "—",
          email: p?.email || "—",
          phone: p?.phone || "—",
          status: mapDbStatusToUi(p?.status),
          package: packageByUserId.get(p.id) ?? "custom",
        };
      });

      setRows(nextRows);
    } catch (error) {
      console.error("Error fetching business users:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesPackage = packageFilter === "all" || row.package.toLowerCase() === packageFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesPackage && matchesStatus;
    });
  }, [packageFilter, rows, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Business List</h1>
          <p className="text-sm text-muted-foreground">Manage business accounts, contacts, and account status.</p>
        </div>

        <Button type="button" onClick={() => navigate("/dashboard/admin/business-users/new")}>
          <Plus className="h-4 w-4" />
          Add New Business
        </Button>
      </header>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Business Accounts</CardTitle>
              <p className="text-xs text-muted-foreground">
                Filters on this page are based on <span className="font-medium">packages</span> and{" "}
                <span className="font-medium">status</span>.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="optimize">Optimize</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="dominate">Dominate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading business accounts...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business ID</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No businesses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={`${row.businessId}-${row.email}`}>
                      <TableCell className="font-medium">{row.businessId}</TableCell>
                      <TableCell className="font-medium">{row.businessName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.contactName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.email}</TableCell>
                      <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{statusLabel[row.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/admin/business-users/${row.userId}`)}
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
