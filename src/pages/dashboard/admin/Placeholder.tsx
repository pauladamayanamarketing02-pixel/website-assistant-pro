import { ArrowRight, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const roadmap: Record<string, string[]> = {
  Users: [
    "Daftar user + detail profil",
    "Suspend / aktifkan user",
    "Catatan internal user",
  ],
  Assists: [
    "Verifikasi assist",
    "Aktif / nonaktif assist",
    "Assign assist ke user + workload",
    "Monitoring performa",
  ],
  Tasks: ["Lihat semua task", "Assign/reassign", "Deadline + prioritas", "Monitoring status"],
  Reports: ["Review laporan", "Approve/reject", "Minta revisi", "Kirim ke user"],
  Support: ["Monitor chat user ↔ assist", "Komplain & tiket", "Internal note"],
  "Quality Control": ["Checklist standar", "Review hasil", "Flag kualitas rendah"],
  "Schedule & SLA": ["Deadline monitoring", "SLA breach alert", "Kalender task"],
  Announcements: ["Broadcast ke assist", "Broadcast ke user", "Maintenance info"],
  "Activity Logs": ["Aktivitas admin", "Aktivitas assist & user", "Filter & search"],
  "My Account": ["Ganti password", "Atur notifikasi", "Riwayat login"],
};

export default function AdminPlaceholder({ title }: { title: string }) {
  const items = roadmap[title] ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3.5 w-3.5" />
            Soon
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Halaman ini masih placeholder. Kita akan isi sesuai SOP Admin Operasional.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yang akan ada di menu ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Roadmap belum ditentukan untuk halaman ini.</div>
          ) : (
            <ul className="space-y-2">
              {items.map((x) => (
                <li key={x} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="mt-0.5 h-4 w-4" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
