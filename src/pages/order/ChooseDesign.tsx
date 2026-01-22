import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useOrder } from "@/contexts/OrderContext";

type Template = {
  id: string;
  name: string;
  category: "business" | "portfolio" | "service" | "agency";
};

const templates: Template[] = [
  { id: "t1", name: "Modern Business", category: "business" },
  { id: "t2", name: "Creative Portfolio", category: "portfolio" },
  { id: "t3", name: "Local Services", category: "service" },
  { id: "t4", name: "Studio Agency", category: "agency" },
  { id: "t5", name: "Clean Services", category: "service" },
  { id: "t6", name: "Bold Business", category: "business" },
];

export default function ChooseDesign() {
  const navigate = useNavigate();
  const { state, setTemplate } = useOrder();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Template["category"] | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      const byCategory = category === "all" ? true : t.category === category;
      const byQuery = !q ? true : t.name.toLowerCase().includes(q);
      return byCategory && byQuery;
    });
  }, [category, query]);

  const selected = state.selectedTemplateId;

  return (
    <OrderLayout title="Choose Design" step="design" sidebar={<OrderSummaryCard />}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter & search template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" />
            <div className="flex gap-2">
              {([
                ["all", "All"],
                ["business", "Business"],
                ["service", "Services"],
                ["portfolio", "Portfolio"],
              ] as const).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={category === key ? "default" : "outline"}
                  onClick={() => setCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => {
            const isSelected = selected === t.id;
            return (
              <Card key={t.id} className={isSelected ? "ring-2 ring-ring" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{t.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Template category</p>
                    </div>
                    <Badge variant="outline">{t.category}</Badge>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
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
