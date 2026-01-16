import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckSquare,
  MessageSquare,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone?: "default" | "warn";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium text-foreground/90">{title}</CardTitle>
          <div
            className={
              "flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-border/60 " +
              (tone === "warn" ? "bg-destructive/10" : "bg-primary/10")
            }
            aria-hidden
          >
            <Icon className={"h-4 w-4 " + (tone === "warn" ? "text-destructive" : "text-primary")} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={"text-3xl font-semibold tracking-tight " + (tone === "warn" ? "text-destructive" : "text-foreground")}>{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminOverview() {
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Operasional</h1>
            <p className="text-sm text-muted-foreground">
              Fokus aksi cepat untuk kondisi harian (data real-time menyusul).
            </p>
          </div>

          <div className="text-xs text-muted-foreground">{today}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Operasional</Badge>
          <Badge variant="outline">Admin</Badge>
          <Badge variant="outline">Aksi cepat</Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="User aktif hari ini" value="—" hint="Login terakhir 24 jam" icon={Users} />
        <StatCard title="Assist aktif" value="—" hint="Aktif hari ini" icon={ShieldCheck} />
        <StatCard title="Task berjalan" value="—" hint="Assigned / In Progress" icon={CheckSquare} />
        <StatCard title="Task terlambat" value="—" hint="Melewati deadline" icon={Timer} tone="warn" />
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        {/* Left column */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Prioritas Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Review laporan pending</div>
                  <div className="text-xs text-muted-foreground">Approve / reject agar bisa dikirim ke user.</div>
                </div>
                <Badge variant="outline">High</Badge>
              </div>
              <Separator />

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Pantau task melewati deadline</div>
                  <div className="text-xs text-muted-foreground">Reassign / set ulang SLA jika perlu.</div>
                </div>
                <Badge variant="outline">High</Badge>
              </div>
              <Separator />

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Tindak lanjut komplain</div>
                  <div className="text-xs text-muted-foreground">Cek percakapan user ↔ assist & buat tiket.</div>
                </div>
                <Badge variant="secondary">Normal</Badge>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="default" className="justify-start" disabled>
                <Link to="/dashboard/admin/tasks">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Buka Tasks
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start" disabled>
                <Link to="/dashboard/admin/assists">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Buka Assists
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start" disabled>
                <Link to="/dashboard/admin/reports">
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Review Reports
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start" disabled>
                <Link to="/dashboard/admin/support">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Support Inbox
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tombol di atas akan aktif setelah modul-modul Admin diimplementasikan.
            </p>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-7">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Laporan Pending Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Belum ada data.
                </div>
                <div className="text-xs text-muted-foreground">
                  Nantinya tampil 5 laporan terbaru: nama user, assist, status, dan aksi.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Komplain / Tiket Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Belum ada data.
                </div>
                <div className="text-xs text-muted-foreground">
                  Nantinya tampil tiket aktif + prioritas + SLA breach alert.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ringkasan Operasional</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  SLA Monitor
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Deadline & reminder otomatis (soon).</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Activity Logs
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Audit aktivitas (read-only) (soon).</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Announcement
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Broadcast info ke user/assist (soon).</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
