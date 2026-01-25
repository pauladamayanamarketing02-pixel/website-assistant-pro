import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type BusinessTypeRow = {
  id: string;
  category: string;
  type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const createSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(80),
  type: z.string().trim().min(1, "Type is required").max(80),
  sort_order: z.coerce.number().int().min(0).max(10000).default(0),
  is_active: z.boolean().default(true),
});

export default function AdminBusinessTypes() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BusinessTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessTypeRow | null>(null);

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { category: "", type: "", sort_order: 0, is_active: true },
  });

  const editForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { category: "", type: "", sort_order: 0, is_active: true },
  });

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("business_types")
        .select("id, category, type, is_active, sort_order, created_at")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("type", { ascending: true });

      if (error) throw error;
      setRows((data ?? []) as BusinessTypeRow[]);
    } catch (e: any) {
      console.error("fetch business_types failed:", e);
      setRows([]);
      toast({
        variant: "destructive",
        title: "Failed to load",
        description: e?.message ? String(e.message) : "Could not load Business Types.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedCount = useMemo(() => new Set(rows.map((r) => r.category)).size, [rows]);

  const onCreate = async (values: z.infer<typeof createSchema>) => {
    try {
      const payload = {
        category: values.category.trim(),
        type: values.type.trim(),
        sort_order: values.sort_order,
        is_active: values.is_active,
      };

      const { error } = await (supabase as any).from("business_types").insert(payload);
      if (error) throw error;

      toast({ title: "Saved", description: "Business Type created." });
      form.reset({ category: "", type: "", sort_order: 0, is_active: true });
      setOpen(false);
      await fetchTypes();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Create failed",
        description: e?.message ? String(e.message) : "Could not create Business Type.",
      });
    }
  };

  const openEditDialog = (row: BusinessTypeRow) => {
    setEditing(row);
    editForm.reset({
      category: row.category,
      type: row.type,
      sort_order: row.sort_order,
      is_active: row.is_active,
    });
    setEditOpen(true);
  };

  const onEdit = async (values: z.infer<typeof createSchema>) => {
    if (!editing) return;

    try {
      const payload = {
        category: values.category.trim(),
        type: values.type.trim(),
        sort_order: values.sort_order,
        is_active: values.is_active,
      };

      const { error } = await (supabase as any).from("business_types").update(payload).eq("id", editing.id);
      if (error) throw error;

      toast({ title: "Saved", description: "Business Type updated." });
      setEditOpen(false);
      setEditing(null);
      await fetchTypes();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: e?.message ? String(e.message) : "Could not update Business Type.",
      });
    }
  };

  const toggleActive = async (id: string, next: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("business_types")
        .update({ is_active: next })
        .eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: next } : r)));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: e?.message ? String(e.message) : "Could not update status.",
      });
    }
  };

  const removeRow = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("business_types").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted", description: "Business Type deleted." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e?.message ? String(e.message) : "Could not delete Business Type.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Business Types</h1>
          <p className="text-sm text-muted-foreground">
            Manage the Business Type list used in onboarding dropdowns. ({groupedCount} categories)
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Business Type</DialogTitle>
                <DialogDescription>Create a new category + type.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Home Services" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Plumbing Service" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                        <FormLabel className="m-0">Active</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Business Type</DialogTitle>
              <DialogDescription>Update category, type, ordering, and status.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Home Services" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Plumbing Service" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                        <FormLabel className="m-0">Active</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditOpen(false);
                      setEditing(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Types</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              No data yet. Add some Business Types to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Category</TableHead>
                    <TableHead className="min-w-[200px]">Type</TableHead>
                    <TableHead className="min-w-[110px]">Order</TableHead>
                    <TableHead className="min-w-[110px]">Active</TableHead>
                    <TableHead className="text-right min-w-[110px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.category}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="text-muted-foreground">{r.sort_order}</TableCell>
                      <TableCell>
                        <Switch checked={r.is_active} onCheckedChange={(v) => void toggleActive(r.id, v)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(r)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" size="sm" variant="ghost" title="Delete">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Business Type?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. Are you sure you want to delete this Business Type?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void removeRow(r.id)}>Yes, delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
