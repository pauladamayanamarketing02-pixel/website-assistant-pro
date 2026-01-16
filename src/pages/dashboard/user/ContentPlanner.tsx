import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Lightbulb, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ContentFilter = "all" | "blog" | "email_marketing" | "social_media" | "gmb_posts";

const FILTER_LABELS: Record<ContentFilter, string> = {
  all: "All Content",
  blog: "Blog Posts",
  email_marketing: "Emails Marketing",
  social_media: "Social Media",
  gmb_posts: "GMB Posts",
};

type Recommendation = {
  id: string;
  type: Exclude<ContentFilter, "all">;
  title: string;
  notes: string;
};

function getMonthlyRecommendations(monthIndex: number): Recommendation[] {
  // monthIndex is 0-11
  // Simple starter recommendations (can be swapped to DB/AI later).
  const themes = [
    "New Year / Fresh Start",
    "Trust & Reviews",
    "Behind The Scenes",
    "Seasonal Offers",
    "Customer Stories",
    "How-to Education",
    "Local Community",
    "Summer / Peak Season",
    "Back-to-Business",
    "Preparation & Planning",
    "Holiday Readiness",
    "Year Wrap-up",
  ];

  const theme = themes[monthIndex] ?? "Monthly Theme";

  return [
    {
      id: `blog-${monthIndex}`,
      type: "blog",
      title: `Blog: ${theme} – 5 Tips for Customers`,
      notes: "Write a practical list post that answers common customer questions.",
    },
    {
      id: `email-${monthIndex}`,
      type: "email_marketing",
      title: `Email: ${theme} – Promo / Reminder`,
      notes: "Short email: value first, then CTA (book, call, visit, order).",
    },
    {
      id: `social-${monthIndex}`,
      type: "social_media",
      title: `Social: ${theme} – 3 Post Ideas`,
      notes: "1) Tip carousel, 2) Before/after, 3) Testimonial screenshot.",
    },
    {
      id: `gmb-${monthIndex}`,
      type: "gmb_posts",
      title: `GMB Post: ${theme} – Weekly Update`,
      notes: "Post an update + photo + link. Keep it short and local.",
    },
  ];
}

export default function ContentPlanner() {
  const [month, setMonth] = useState<Date>(new Date());
  const [filter, setFilter] = useState<ContentFilter>("all");

  const recommendations = useMemo(() => {
    const base = getMonthlyRecommendations(month.getMonth());
    if (filter === "all") return base;
    return base.filter((r) => r.type === filter);
  }, [month, filter]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          Content Planner
        </h1>
        <p className="text-muted-foreground">
          Rencanakan konten per bulan, lihat rekomendasi ide, dan atur fokus konten.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Kalender Bulanan</span>
              <span className="text-sm font-medium text-muted-foreground">{format(month, "MMMM yyyy")}</span>
            </CardTitle>
            <CardDescription>Pilih bulan untuk melihat rekomendasi konten.</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={month}
              onSelect={(d) => d && setMonth(d)}
              month={month}
              onMonthChange={setMonth}
              className="p-3 pointer-events-auto"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Rekomendasi Konten
            </CardTitle>
            <CardDescription>Ide konten yang direkomendasikan untuk bulan ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Sortir</div>
              <Select value={filter} onValueChange={(v) => setFilter(v as ContentFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe konten" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILTER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada rekomendasi untuk filter ini.</p>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.id} className="rounded-lg border border-border p-3">
                    <div className="text-sm font-semibold text-foreground">{rec.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{rec.notes}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Next Steps</div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Buat item konten (title, platform, due date)</li>
                <li>Attach asset dari My Gallery</li>
                <li>Kirim draft ke Assist untuk review</li>
              </ul>
              <Button variant="outline" disabled className="w-full">
                Coming soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

