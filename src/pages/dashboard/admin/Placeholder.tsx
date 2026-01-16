import { ArrowRight, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const roadmap: Record<string, string[]> = {
  "Bussines User": [
    "Daftar user + detail profil bisnis",
    "Suspend / aktifkan user",
    "Catatan internal user",
  ],
  Assistant: [
    "Verifikasi assistant",
    "Aktif / nonaktif assistant",
    "Assign assistant ke user + workload",
    "Monitoring performa",
  ],
  Tasks: ["Lihat semua task", "Assign/reassign", "Deadline + prioritas", "Monitoring status"],
  Reports: ["Review laporan", "Approve/reject", "Minta revisi", "Kirim ke user"],
  Support: ["Monitor chat user ↔ assistant", "Komplain & tiket", "Internal note"],
  Website: ["Kelola halaman website", "Blog & artikel", "Media library", "SEO"],
  Pages: ["Daftar halaman", "Edit konten", "Publish / unpublish", "Preview"],
  Blog: ["Daftar artikel", "Editor", "Kategori & tag", "Publish"],
  "Media Library": ["Upload gambar", "Folder/label", "Optimasi gambar", "Pakai di konten"],
  SEO: ["Meta title/description", "OG image", "Sitemap/robots", "Audit"],
  Announcements: ["Broadcast ke assistant", "Broadcast ke user", "Maintenance info"],
  "Quality Control": ["Checklist standar", "Review hasil", "Flag kualitas rendah"],
  "Activity Logs": ["Aktivitas admin", "Aktivitas assistant & user", "Filter & search"],
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
