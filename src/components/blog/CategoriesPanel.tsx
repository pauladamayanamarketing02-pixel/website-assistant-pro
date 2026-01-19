import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BlogCategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
};

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

type Props = {
  categories: BlogCategoryRow[];
  selectedIds: string[];
  onSelectedIdsChange: (next: string[]) => void;
  onCreated?: (newCategory: BlogCategoryRow) => void;
};

export function CategoriesPanel({ categories, selectedIds, onSelectedIdsChange, onCreated }: Props) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parents = useMemo(() => categories, [categories]);

  const toggle = (id: string) => {
    onSelectedIdsChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const createCategory = async () => {
    const nm = name.trim();
    if (!nm) return;
    setSaving(true);
    try {
      const payload: any = { name: nm, slug: slugify(nm) };
      if (parentId) payload.parent_id = parentId;

      const { data, error } = await supabase
        .from("blog_categories")
        .insert(payload)
        .select("id,name,slug,parent_id")
        .single();
      if (error) throw error;

      const created = data as BlogCategoryRow;
      onCreated?.(created);
      setName("");
      setParentId(null);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Toggle categories">
              <ChevronDown className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="rounded-md border border-border p-3 space-y-2 max-h-52 overflow-auto">
            {categories.length ? (
              categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                  <span className="text-foreground">{c.name}</span>
                </label>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Belum ada kategori.</div>
            )}

            <div className="pt-1">
              <Button type="button" variant="link" className="px-0 h-auto" onClick={() => setAdding((v) => !v)}>
                Add New Category
              </Button>
            </div>

            {adding ? (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">NEW CATEGORY NAME</div>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kategori" />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">PARENT CATEGORY</div>
                  <Select value={parentId ?? "__none"} onValueChange={(v) => setParentId(v === "__none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="— Parent Category —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Parent Category —</SelectItem>
                      {parents.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" onClick={() => void createCategory()} disabled={saving}>
                  {saving ? "Saving..." : "Add New Category"}
                </Button>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
