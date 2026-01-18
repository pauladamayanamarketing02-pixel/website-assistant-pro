import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Mail,
  Megaphone,
  MessageSquareText,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  businessName: string | null;
  businessId: string;
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

export default function AssistCalendar() {
  const { toast } = useToast();

  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("all");

  const [items, setItems] = useState<ScheduledContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, business_name")
          .order("business_name", { ascending: true });

        if (cancelled) return;
        if (error) throw error;

        const mapped: BusinessOption[] = (data ?? []).map((b: any) => ({
          id: b.id as string,
          name: (b.business_name ?? "Unnamed Business") as string,
        }));

        setBusinesses(mapped);
      } catch (e: any) {
        // Keep the calendar usable even if the filter list fails
        console.error("Failed to load businesses", e);
        setBusinesses([]);
      }
    };

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const from = startOfMonth(month).toISOString();
        const to = endOfMonth(month).toISOString();

        let query = supabase
          .from("content_items")
          .select(
            "id, title, business_id, scheduled_at, platform, businesses(business_name), content_types(name)",
          )
          .not("scheduled_at", "is", null)
          .is("deleted_at", null)
          .gte("scheduled_at", from)
          .lte("scheduled_at", to)
          .order("scheduled_at", { ascending: true });

        if (selectedBusinessId !== "all") {
          query = query.eq("business_id", selectedBusinessId);
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
            businessName: (d.businesses?.business_name ?? null) as string | null,
            businessId: d.business_id as string,
          }));

        setItems(mapped);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to load calendar",
          description: e?.message ?? "Unknown error",
        });
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [month, selectedBusinessId, toast]);

  const dayToItems = useMemo(() => {
    const map = new Map<string, ScheduledContentItem[]>();
    for (const it of items) {
      const dayKey = format(new Date(it.scheduledAt), "yyyy-MM-dd");
      const arr = map.get(dayKey) ?? [];
      arr.push(it);
      map.set(dayKey, arr);
    }
    return map;
  }, [items]);

  const daysWithItems = useMemo(() => {
    const days: Date[] = [];
    for (const it of items) {
      days.push(new Date(it.scheduledAt));
    }
    return days;
  }, [items]);

  const selectedItems = useMemo(() => {
    const key = format(selectedDay, "yyyy-MM-dd");
    return dayToItems.get(key) ?? [];
  }, [dayToItems, selectedDay]);

  const selectedItemsSorted = useMemo(() => {
    return [...selectedItems].sort((a, b) => {
      const nameA = (a.businessName ?? "").toLowerCase();
      const nameB = (b.businessName ?? "").toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  }, [selectedItems]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          Calendar
        </h1>
        <p className="text-muted-foreground">
          Shows scheduled content from <span className="font-medium">Content Creation</span>.
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
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Filter by business name" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Businesses</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <CardDescription>
              Select a date to view scheduled content. {loading ? "Loading…" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <div className="mx-auto w-full max-w-none">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(d) => d && setSelectedDay(d)}
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
                    caption_label: "text-base font-semibold",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md w-full font-medium text-sm flex-1 text-center",
                    row: "flex w-full mt-3",
                    cell: "h-16 flex-1 text-center text-base p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-16 w-full p-0 font-normal aria-selected:opacity-100",
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const key = format(date, "yyyy-MM-dd");
                      const dayItems = dayToItems.get(key) ?? [];
                      const uniqueTypes = Array.from(new Set(dayItems.map((d) => d.contentTypeName))).slice(0, 3);

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
            <CardTitle>Schedule Detail</CardTitle>
            <CardDescription>{format(selectedDay, "EEEE, dd MMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedItemsSorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scheduled content on this date.
              </p>
            ) : (
              selectedItemsSorted.map((it) => {
                const Icon = getTypeIcon(it.contentTypeName);
                const time = format(new Date(it.scheduledAt), "HH:mm");

                return (
                  <div key={it.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-primary mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {it.title}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {time} • {it.contentTypeName || "(No type)"}
                          {it.platform ? ` • ${it.platform}` : ""}
                        </div>
                        {it.businessName ? (
                          <div className="mt-1 text-xs text-muted-foreground truncate">
                            Business: {it.businessName}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
