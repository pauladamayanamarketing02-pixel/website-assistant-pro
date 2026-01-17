import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type LookupTab = "category" | "content";

type LookupRow = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: LookupTab;
  onTabChange: (tab: LookupTab) => void;
  onChanged?: () => void;
};

async function fetchTable(tab: LookupTab): Promise<LookupRow[]> {
  const table = tab === "category" ? "content_categories" : "content_types";
  const { data, error } = await supabase.from(table as any).select("id,name").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any;
}

export default function ManageLookupsDialog({ open, onOpenChange, tab, onTabChange, onChanged }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<LookupRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [newValue, setNewValue] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingDraft, setEditingDraft] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchTable(tab);
      setRows(next);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to load", description: err?.message ?? "" });
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  React.useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, reload]);

  React.useEffect(() => {
    setNewValue("");
    setEditingId(null);
    setEditingDraft("");
  }, [tab]);

  const add = async () => {
    const name = newValue.trim();
    if (!name) return;

    try {
      const table = tab === "category" ? "content_categories" : "content_types";
      const { error } = await supabase.from(table as any).insert({ name } as any);
      if (error) throw error;
      setNewValue("");
      toast({ title: "Added", description: `${tab === "category" ? "Category" : "Content type"} added.` });
      await reload();
      onChanged?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Add failed", description: err?.message ?? "" });
    }
  };

  const startEdit = (row: LookupRow) => {
    setEditingId(row.id);
    setEditingDraft(row.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDraft("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editingDraft.trim();
    if (!name) return;

    try {
      const table = tab === "category" ? "content_categories" : "content_types";
      const { error } = await supabase.from(table as any).update({ name } as any).eq("id", editingId);
      if (error) throw error;
      toast({ title: "Saved", description: "Changes saved." });
      cancelEdit();
      await reload();
      onChanged?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err?.message ?? "" });
    }
  };

  const remove = async (id: string) => {
    try {
      const table = tab === "category" ? "content_categories" : "content_types";
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Item deleted." });
      await reload();
      onChanged?.();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err?.message ?? "This item may be in use by content items.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage</DialogTitle>
          <DialogDescription>
            Manage Categories and Content Types used by the Add Content form.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => onTabChange(v as LookupTab)}>
          <TabsList>
            <TabsTrigger value="category">Categories</TabsTrigger>
            <TabsTrigger value="content">Content Types</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={tab === "category" ? "New category name" : "New content type name"}
              />
              <Button type="button" onClick={add} disabled={loading}>
                Add
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tab === "category" ? "Category" : "Content Type"}</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isEditing = editingId === r.id;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input value={editingDraft} onChange={(e) => setEditingDraft(e.target.value)} />
                        ) : (
                          <span className="font-medium">{r.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button type="button" size="sm" onClick={saveEdit}>
                                Save
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(r)}>
                              Edit
                            </Button>
                          )}
                          <Button type="button" size="sm" variant="outline" onClick={() => remove(r.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                      No items yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
