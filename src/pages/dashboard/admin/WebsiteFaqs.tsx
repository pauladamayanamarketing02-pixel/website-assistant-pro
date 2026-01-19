import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

import type { Database } from "@/integrations/supabase/types";

type FaqRow = Database["public"]["Tables"]["website_faqs"]["Row"];

const pageOptions = [
  { value: "services", label: "Services (/services)" },
  { value: "packages", label: "Packages (/packages)" },
  { value: "contact", label: "Contact (/contact)" },
  { value: "home", label: "Home (/)" },
  { value: "about", label: "About (/about)" },
] as const;

type PageKey = (typeof pageOptions)[number]["value"];

type FormState = {
  id?: string;
  page: PageKey;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

function emptyForm(page: PageKey): FormState {
  return {
    page,
    question: "",
    answer: "",
    sort_order: 0,
    is_published: true,
  };
}

export default function WebsiteFaqs() {
  const [page, setPage] = useState<PageKey>("services");
  const [items, setItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm("services"));

  const load = useCallback(async (p: PageKey) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("website_faqs")
        .select("id,page,question,answer,sort_order,is_published,created_at,updated_at")
        .eq("page", p)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems((data ?? []) as FaqRow[]);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat FAQ",
        description: e?.message || "Terjadi kesalahan.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const openCreate = () => {
    setForm(emptyForm(page));
    setOpen(true);
  };

  const openEdit = (row: FaqRow) => {
    setForm({
      id: row.id,
      page: (row.page as PageKey) ?? page,
      question: row.question ?? "",
      answer: row.answer ?? "",
      sort_order: row.sort_order ?? 0,
      is_published: row.is_published ?? true,
    });
    setOpen(true);
  };

  const canSubmit = useMemo(() => {
    return !!form.question.trim() && !!form.answer.trim() && !saving;
  }, [form.answer, form.question, saving]);

  const handleSave = async () => {
    if (!canSubmit) return;

    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase
          .from("website_faqs")
          .update({
            page: form.page,
            question: form.question.trim(),
            answer: form.answer.trim(),
            sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
            is_published: !!form.is_published,
          })
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("website_faqs").insert({
          page: form.page,
          question: form.question.trim(),
          answer: form.answer.trim(),
          sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
          is_published: !!form.is_published,
        } as any);
        if (error) throw error;
      }

      setOpen(false);
      await load(page);
      toast({ title: "Tersimpan", description: "FAQ berhasil disimpan." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: e?.message || "Terjadi kesalahan." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: FaqRow) => {
    const ok = window.confirm("Hapus FAQ ini?");
    if (!ok) return;

    try {
      const { error } = await supabase.from("website_faqs").delete().eq("id", row.id);
      if (error) throw error;
      setItems((prev) => prev.filter((x) => x.id !== row.id));
      toast({ title: "Deleted", description: "FAQ dihapus." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete gagal", description: e?.message || "Terjadi kesalahan." });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">FAQs</h1>
          <p className="text-sm text-muted-foreground">Kelola FAQ yang tampil di halaman publik (berdasarkan page).</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={page} onValueChange={(v) => setPage(v as PageKey)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>FAQ List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Belum ada FAQ untuk page ini.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Order</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-[110px]">Published</TableHead>
                  <TableHead className="w-[220px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.sort_order ?? 0}</TableCell>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="text-foreground">{row.question}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{row.answer}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={row.is_published ? "text-foreground" : "text-muted-foreground"}>
                        {row.is_published ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleDelete(row)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (!saving ? setOpen(v) : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Page</Label>
              <Select value={form.page} onValueChange={(v) => setForm((p) => ({ ...p, page: v as PageKey }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                placeholder="Tulis pertanyaan..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Answer</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                rows={6}
                placeholder="Tulis jawaban..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={String(form.sort_order)}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value || 0) }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Published</div>
                  <div className="text-xs text-muted-foreground">Tampilkan di halaman publik</div>
                </div>
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={!canSubmit}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
