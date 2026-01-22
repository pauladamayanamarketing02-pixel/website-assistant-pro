import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderLayout } from "@/components/order/OrderLayout";
import { useOrder } from "@/contexts/OrderContext";
import { useOrderPublicSettings, type OrderTemplate } from "@/hooks/useOrderPublicSettings";

export default function ChooseDesign() {
  const navigate = useNavigate();
  const { state, setTemplate } = useOrder();
  const { templates } = useOrderPublicSettings();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<OrderTemplate["category"] | "all">("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) {
      const c = String(t.category ?? "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = templates.filter((t) => {
      const byCategory = category === "all" ? true : t.category === category;
      const byQuery = !q ? true : t.name.toLowerCase().includes(q);
      return byCategory && byQuery;
    });
    // Keep list stable and consistent with admin `sort_order` (no user-facing sort choices).
    return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [category, query, templates]);

  const selected = state.selectedTemplateId;

  return (
    <OrderLayout title="Choose Design" step="design" sidebar={null}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter & search template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input className="md:flex-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" />
            <div className="md:w-[220px]">
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const isSelected = selected === t.id;
            const previewImg = String((t as any)?.preview_image_url ?? "").trim();
            const demoUrl = String(t.preview_url ?? "").trim();
            return (
              <Card key={t.id} className={isSelected ? "ring-2 ring-ring" : ""}>
                <CardContent className="p-5">
                  <div className="mb-4 overflow-hidden rounded-md border bg-muted">
                    <AspectRatio ratio={16 / 9}>
                      {previewImg ? (
                        <img
                          src={previewImg}
                          alt={`Preview ${t.name}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <img
                          src="/placeholder.svg"
                          alt="Template preview placeholder"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </AspectRatio>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{t.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Template category</p>
                    </div>
                    <Badge variant="outline">{t.category}</Badge>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const url = String(t.preview_url ?? "").trim();
                        if (!url) return;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      disabled={!demoUrl}
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setTemplate({ id: t.id, name: t.name })}
                      variant={isSelected ? "secondary" : "default"}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/order/choose-domain")}
          >
            Back
          </Button>
          <Button type="button" size="lg" disabled={!selected} onClick={() => navigate("/order/details")}>
            Continue to Details
          </Button>
        </div>
      </div>
    </OrderLayout>
  );
}
