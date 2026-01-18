import { useEffect, useMemo, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  CalendarDays,
  Eye,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  Mail,
  Megaphone,
  MessageSquareText,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ContentFilter = "all" | "blog" | "email_marketing" | "social_media" | "gmb_posts";

type BusinessOption = {
  id: string;
  name: string;
};

type ScheduledContentItem = {
  id: string;
  title: string;
  scheduledAt: string; // ISO
  contentTypeName: string;
  platform: string | null;
  businessId: string;
  businessName: string | null;
};

type RecommendationIdea = {
  kind: "idea";
  id: string;
  type: Exclude<ContentFilter, "all">;
  title: string;
  notes: string;
};

type Recommendation =
  | {
      kind: "scheduled";
      id: string;
      type: Exclude<ContentFilter, "all">;
      title: string;
      scheduledAt: string;
      contentTypeName: string;
      platform: string | null;
      businessName: string | null;
    }
  | RecommendationIdea;

const FILTER_LABELS: Record<ContentFilter, string> = {
  all: "All Content",
  blog: "Blog Posts",
  email_marketing: "Email Marketing",
  social_media: "Social Media",
  gmb_posts: "Google Business Posts",
};

function normalizeTypeName(name: string) {
  return (name ?? "").trim().toLowerCase();
}

function getTypeIcon(typeName: string) {
  const key = normalizeTypeName(typeName);
  if (key.includes("blog")) return FileText;
  if (key.includes("email")) return Mail;
  if (key.includes("ads")) return Megaphone;
  if (key.includes("social")) return ImageIcon;
  if (key.includes("gmb")) return MessageSquareText;
  return CalendarDays;
}

function mapTypeToFilter(typeName: string): Exclude<ContentFilter, "all"> {
  const key = normalizeTypeName(typeName);
  if (key.includes("blog")) return "blog";
  if (key.includes("email")) return "email_marketing";
  if (key.includes("gmb")) return "gmb_posts";
  // default to social
  return "social_media";
}

function getMonthlyRecommendations(monthIndex: number): RecommendationIdea[] {
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
      kind: "idea",
      id: `blog-${monthIndex}`,
      type: "blog",
      title: `Blog: ${theme} – 5 Tips for Customers`,
      notes: "Write a practical list post that answers common customer questions.",
    },
    {
      kind: "idea",
      id: `email-${monthIndex}`,
      type: "email_marketing",
      title: `Email: ${theme} – Promo / Reminder`,
      notes: "Short email: value first, then a clear call to action (book, call, visit, order).",
    },
    {
      kind: "idea",
      id: `social-${monthIndex}`,
      type: "social_media",
      title: `Social: ${theme} – 3 Post Ideas`,
      notes: "1) Tip carousel, 2) Before/after, 3) Testimonial screenshot.",
    },
    {
      kind: "idea",
      id: `gmb-${monthIndex}`,
      type: "gmb_posts",
      title: `GMB Post: ${theme} – Weekly Update`,
      notes: "Post an update + photo + link. Keep it short and local.",
    },
  ];
}

export default function ContentPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [month, setMonth] = useState<Date>(new Date());
  const [filter, setFilter] = useState<ContentFilter>("all");

  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const [scheduledItems, setScheduledItems] = useState<ScheduledContentItem[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const [viewItem, setViewItem] = useState<Recommendation | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBusinesses = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, business_name")
          .eq("user_id", user.id)
          .order("business_name", { ascending: true });

        if (cancelled) return;
        if (error) throw error;

        const mapped: BusinessOption[] = (data ?? []).map((b: any) => ({
          id: b.id as string,
          name: (b.business_name ?? "Unnamed Business") as string,
        }));

        setBusinesses(mapped);

        // Default to the first business so users never see an "All Businesses" view.
        if (!selectedBusinessId && mapped.length > 0) {
          setSelectedBusinessId(mapped[0].id);
        }
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to load businesses",
          description: e?.message ?? "Unknown error",
        });
        setBusinesses([]);
      }
    };

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId, toast, user]);

  useEffect(() => {
    let cancelled = false;

    const loadScheduled = async () => {
      if (!user) return;

      const businessIds = businesses.map((b) => b.id);
      if (businessIds.length === 0) {
        setScheduledItems([]);
        return;
      }

      setLoadingScheduled(true);
      try {
        const from = startOfMonth(month).toISOString();
        const to = endOfMonth(month).toISOString();

        let query = supabase
          .from("content_items")
          .select(
            "id, title, business_id, scheduled_at, platform, businesses!inner(business_name, user_id), content_types(name)",
          )
          // Hard guarantee: only show scheduled content for the logged-in user's businesses
          .eq("businesses.user_id", user.id)
          .not("scheduled_at", "is", null)
          .is("deleted_at", null)
          .gte("scheduled_at", from)
          .lte("scheduled_at", to)
          .order("scheduled_at", { ascending: true });

        if (selectedBusinessId) {
          query = query.eq("business_id", selectedBusinessId);
        } else {
          query = query.in("business_id", businessIds);
        }

        const { data, error } = await query;
        if (cancelled) return;
        if (error) throw error;

        const mapped: ScheduledContentItem[] = ((data ?? []) as any[])
          .filter((d) => Boolean(d.scheduled_at))
          .map((d) => ({
            id: d.id as string,
            title: (d.title ?? "Untitled") as string,
            scheduledAt: d.scheduled_at as string,
            contentTypeName: (d.content_types?.name ?? "") as string,
            platform: (d.platform ?? null) as string | null,
            businessId: d.business_id as string,
            businessName: (d.businesses?.business_name ?? null) as string | null,
          }));

        setScheduledItems(mapped);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to load schedule",
          description: e?.message ?? "Unknown error",
        });
        setScheduledItems([]);
      } finally {
        if (!cancelled) setLoadingScheduled(false);
      }
    };

    void loadScheduled();

    return () => {
      cancelled = true;
    };
  }, [businesses, month, selectedBusinessId, toast, user]);

  const dayToScheduled = useMemo(() => {
    const map = new Map<string, ScheduledContentItem[]>();
    for (const it of scheduledItems) {
      const dayKey = format(new Date(it.scheduledAt), "yyyy-MM-dd");
      const arr = map.get(dayKey) ?? [];
      arr.push(it);
      map.set(dayKey, arr);
    }
    return map;
  }, [scheduledItems]);

  const daysWithItems = useMemo(() => {
    return scheduledItems.map((it) => new Date(it.scheduledAt));
  }, [scheduledItems]);

  const recommendations = useMemo(() => {
    const scheduled: Recommendation[] = scheduledItems.map((it) => ({
      kind: "scheduled",
      id: it.id,
      type: mapTypeToFilter(it.contentTypeName),
      title: it.title,
      scheduledAt: it.scheduledAt,
      contentTypeName: it.contentTypeName,
      platform: it.platform,
      businessName: it.businessName,
    }));

    const filtered = filter === "all" ? scheduled : scheduled.filter((r) => r.type === filter);

    // Sort by the month currently shown on the calendar (already filtered in query), then by date/time.
    return [...filtered].sort((a, b) => {
      if (a.kind === "scheduled" && b.kind === "scheduled") {
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });
  }, [filter, scheduledItems]);

  const handlePost = () => {
    // User requested button only (no integration yet)
    toast({
      title: "Post",
      description: "Post action is not configured yet.",
    });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          Content Planner
        </h1>
        <p className="text-muted-foreground">
          Plan your content month by month, review scheduled items, and follow recommendations.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Monthly Calendar</span>
                <span className="text-sm font-medium text-muted-foreground">{format(month, "MMMM yyyy")}</span>
              </CardTitle>

              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger className="w-full sm:w-[280px]" disabled={businesses.length <= 1}>
                  <SelectValue placeholder="Business" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <CardDescription>
              Scheduled content is marked on the calendar. {loadingScheduled ? "Loading…" : ""}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-x-auto">
              <div className="mx-auto w-full max-w-none">
                <Calendar
                  mode="single"
                  selected={month}
                  onSelect={(d) => d && setMonth(d)}
                  month={month}
                  onMonthChange={setMonth}
                  modifiers={{ hasContent: daysWithItems }}
                  modifiersClassNames={{
                    hasContent: "ring-1 ring-primary/30 rounded-md",
                  }}
                  className="w-full p-3 pointer-events-auto"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-6",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-base font-semibold",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell:
                      "text-muted-foreground rounded-md w-full font-medium text-sm flex-1 text-center",
                    row: "flex w-full mt-3",
                    cell: "h-16 flex-1 text-center text-base p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-16 w-full p-0 font-normal aria-selected:opacity-100",
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const key = format(date, "yyyy-MM-dd");
                      const dayItems = dayToScheduled.get(key) ?? [];
                      const uniqueTypes = Array.from(
                        new Set(dayItems.map((d) => d.contentTypeName)),
                      ).slice(0, 3);

                      return (
                        <div className="h-full w-full flex flex-col items-center justify-between py-1">
                          <div className="text-sm">{date.getDate()}</div>
                          <div className="flex items-center gap-1 pb-1">
                            {uniqueTypes.map((t) => {
                              const Icon = getTypeIcon(t);
                              return <Icon key={t} className="h-3.5 w-3.5 text-primary" />;
                            })}
                          </div>
                        </div>
                      );
                    },
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Content Recommendations
            </CardTitle>
            <CardDescription>
              Shows only content scheduled on the calendar for {format(month, "MMMM yyyy")}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Filter</div>
              <Select value={filter} onValueChange={(v) => setFilter(v as ContentFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a content type" />
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
                <p className="text-sm text-muted-foreground">No recommendations for this month.</p>
              ) : (
                recommendations.map((rec) => {
                  const iconLabel = rec.kind === "scheduled" ? rec.contentTypeName : rec.type;
                  const Icon = getTypeIcon(iconLabel);

                  return (
                    <div key={`${rec.kind}-${rec.id}`} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">{rec.title}</div>

                            {rec.kind === "scheduled" ? (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {format(new Date(rec.scheduledAt), "dd MMM • HH:mm")}
                                {rec.platform ? ` • ${rec.platform}` : ""}
                                {rec.businessName ? ` • ${rec.businessName}` : ""}
                              </div>
                            ) : (
                              <div className="mt-1 text-sm text-muted-foreground">{rec.notes}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button type="button" variant="outline" size="sm" onClick={() => setViewItem(rec)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button type="button" variant="secondary" size="sm" onClick={handlePost}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Post</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Content</DialogTitle>
            <DialogDescription>Details for the selected item.</DialogDescription>
          </DialogHeader>

          {viewItem ? (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Title:</span> {viewItem.title}
              </div>

              {viewItem.kind === "scheduled" ? (
                <>
                  <div className="text-sm">
                    <span className="font-medium">Scheduled:</span>{" "}
                    {format(new Date(viewItem.scheduledAt), "EEEE, dd MMM yyyy • HH:mm")}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Business:</span> {viewItem.businessName ?? "-"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {viewItem.contentTypeName || "-"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Platform:</span> {viewItem.platform ?? "-"}
                  </div>
                </>
              ) : (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span> {viewItem.notes}
                </div>
              )}

              <div className="pt-2">
                <Button type="button" className="w-full" onClick={handlePost}>
                  Post
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
