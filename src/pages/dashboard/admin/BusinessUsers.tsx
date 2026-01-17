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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BusinessStatus = "active" | "suspended" | "pending";

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
  suspended: "Suspended",
  pending: "Pending",
};

export default function AdminBusinessUsers() {
  const [packageFilter, setPackageFilter] = useState<string>("all");

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
        status: "suspended",
        package: "dominate",
      },
      {
        businessId: "BIZ-0004",
        businessName: "Evergreen Fitness",
        contactName: "Noah Williams",
        email: "noah@evergreenfit.com",
        phone: "+1 555-0144",
        status: "active",
        package: "pro",
      },
      {
        businessId: "BIZ-0005",
        businessName: "Kopi Pagi",
        contactName: "Siti Rahma",
        email: "siti@kopipagi.id",
        phone: "+62 811-1234-5678",
        status: "active",
        package: "custom",
      },
    ],
    [],
  );

  const filteredRows = useMemo(() => {
    if (packageFilter === "all") return rows;
    return rows.filter((row) => row.package.toLowerCase() === packageFilter.toLowerCase());
  }, [packageFilter, rows]);

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Business Accounts</CardTitle>
              <p className="text-xs text-muted-foreground">Filter businesses by package.</p>
            </div>

            <Tabs value={packageFilter} onValueChange={setPackageFilter}>
              <TabsList className="flex flex-wrap justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="starter">Starter</TabsTrigger>
                <TabsTrigger value="growth">Growth</TabsTrigger>
                <TabsTrigger value="pro">Pro</TabsTrigger>
                <TabsTrigger value="optimize">Optimize</TabsTrigger>
                <TabsTrigger value="scale">Scale</TabsTrigger>
                <TabsTrigger value="dominate">Dominate</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
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
