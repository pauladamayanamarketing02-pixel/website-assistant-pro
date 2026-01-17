import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";

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

type BusinessStatus =
  | "active"
  | "pending"
  | "inactive"
  | "trial"
  | "expired"
  | "cancelled";

type BusinessPackage =
  | "starter"
  | "growth"
  | "pro"
  | "optimize"
  | "scale"
  | "dominate"
  | "custom";

type BusinessAccountRow = {
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

export default function AdminBusinessUsers() {
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rows = useMemo<BusinessAccountRow[]>(
    () => [
      {
        businessId: "BIZ-0001",
        businessName: "Sunrise Coffee",
        contactName: "Ava Johnson",
        email: "ava@sunrisecoffee.com",
        phone: "+1 555-0101",
        status: "active",
        package: "starter",
      },
      {
        businessId: "BIZ-0002",
        businessName: "Nusa Creative Studio",
        contactName: "Rizky Pratama",
        email: "rizky@nusacreative.co",
        phone: "+62 812-0000-0000",
        status: "pending",
        package: "growth",
      },
      {
        businessId: "BIZ-0003",
        businessName: "Ocean Laundry",
        contactName: "Mia Chen",
        email: "mia@oceanlaundry.com",
        phone: "+1 555-0199",
        status: "inactive",
        package: "dominate",
      },
      {
        businessId: "BIZ-0004",
        businessName: "Evergreen Fitness",
        contactName: "Noah Williams",
        email: "noah@evergreenfit.com",
        phone: "+1 555-0144",
        status: "trial",
        package: "pro",
      },
      {
        businessId: "BIZ-0005",
        businessName: "Kopi Pagi",
        contactName: "Siti Rahma",
        email: "siti@kopipagi.id",
        phone: "+62 811-1234-5678",
        status: "expired",
        package: "custom",
      },
    ],
    []
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesPackage =
        packageFilter === "all" || row.package.toLowerCase() === packageFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesPackage && matchesStatus;
    });
  }, [packageFilter, rows, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Business List</h1>
          <p className="text-sm text-muted-foreground">
            Manage business accounts, contacts, and account status.
          </p>
        </div>

        <Button type="button" onClick={() => {}}>
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
                  <TableRow key={row.businessId}>
                    <TableCell className="font-medium">{row.businessId}</TableCell>
                    <TableCell className="font-medium">{row.businessName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.contactName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>
                    <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{statusLabel[row.status]}</Badge>
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
