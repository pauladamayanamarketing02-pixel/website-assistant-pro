import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";

import type { Database } from "@/integrations/supabase/types";

type BlogPostStatus = Database["public"]["Enums"]["blog_post_status"];

type CategoryRow = Database["public"]["Tables"]["blog_categories"]["Row"];

type TagRow = Database["public"]["Tables"]["blog_tags"]["Row"];

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const estimateReadingTimeMinutes = (html: string) => {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export default function AdminWebsiteBlogCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const [authorId, setAuthorId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [excerpt, setExcerpt] = useState("");

  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");

  const [status, setStatus] = useState<BlogPostStatus>("draft");
  const [publishAt, setPublishAt] = useState<string>(""); // datetime-local

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const next = slugify(title);
    // only auto-fill when slug still matches previous title-ish (or empty)
    setSlug((prev) => {
      if (!prev) return next;
      // if user already customized slug, don't overwrite
      return prev;
    });

    setMetaTitle((prev) => (prev ? prev : title));
  }, [title]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        setAuthorId(userData.user?.id ?? null);

        const [{ data: catData, error: catErr }, { data: tagData, error: tagErr }] = await Promise.all([
          supabase.from("blog_categories").select("id, name, slug, is_locked, created_at").order("name"),
          supabase.from("blog_tags").select("id, name, slug, created_at").order("name"),
        ]);

        if (catErr) throw catErr;
        if (tagErr) throw tagErr;

        setCategories((catData ?? []) as any);
        setTags((tagData ?? []) as any);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Gagal memuat data",
          description: e?.message || "Terjadi kesalahan.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const ensureTagsExistAndReturnIds = async (raw: string): Promise<string[]> => {
    const names = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return [];

    const newIds: string[] = [];

    for (const name of names) {
      const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        newIds.push(existing.id);
        continue;
      }

      const newSlug = slugify(name);
      const { data, error } = await supabase
        .from("blog_tags")
        .insert({ name, slug: newSlug })
        .select("id, name, slug, created_at")
        .single();

      if (error) throw error;
      setTags((prev) => [...prev, data as any].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))));
      newIds.push((data as any).id);
    }

    return newIds;
  };

  const validate = () => {
    if (!authorId) {
      toast({ variant: "destructive", title: "Author tidak ditemukan (silakan login ulang)" });
      return false;
    }
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Title wajib diisi" });
      return false;
    }
    if (!slugify(slug).trim()) {
      toast({ variant: "destructive", title: "Slug wajib diisi" });
      return false;
    }
    if (!contentHtml || contentHtml.replace(/<[^>]*>/g, "").trim().length < 10) {
      toast({ variant: "destructive", title: "Content wajib diisi" });
      return false;
    }
    if (!excerpt.trim()) {
      toast({ variant: "destructive", title: "Excerpt wajib diisi" });
      return false;
    }
    if (selectedCategoryIds.length < 1) {
      toast({ variant: "destructive", title: "Minimal pilih 1 kategori" });
      return false;
    }
    if (!metaTitle.trim()) {
      toast({ variant: "destructive", title: "Meta Title wajib diisi" });
      return false;
    }
    if (!metaDescription.trim()) {
      toast({ variant: "destructive", title: "Meta Description wajib diisi" });
      return false;
    }
    if (metaDescription.trim().length > 160) {
      toast({ variant: "destructive", title: "Meta Description maksimal 160 karakter" });
      return false;
    }
    if (status === "scheduled" && !publishAt) {
      toast({ variant: "destructive", title: "Publish Date wajib untuk Scheduled" });
      return false;
    }
    return true;
  };

  const savePost = async (nextStatus: BlogPostStatus) => {
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    try {
      // allow quick tag add via input before saving
      const createdTagIds = await ensureTagsExistAndReturnIds(tagInput);
      const finalTagIds = Array.from(new Set([...selectedTagIds, ...createdTagIds]));

      const nowIso = new Date().toISOString();
      const publishAtIso = nextStatus === "scheduled" ? new Date(publishAt).toISOString() : nextStatus === "published" ? nowIso : null;

      const { data: inserted, error: insertErr } = await supabase
        .from("blog_posts")
        .insert({
          author_id: authorId as string,
          title: title.trim(),
          slug: slugify(slug),
          content_html: contentHtml,
          excerpt: excerpt.trim(),
          featured_image_url: featuredImageUrl.trim() || null,
          featured_image_alt: featuredImageAlt.trim() || null,
          status: nextStatus,
          publish_at: publishAtIso,
          meta_title: metaTitle.trim(),
          meta_description: metaDescription.trim(),
          reading_time_minutes: estimateReadingTimeMinutes(contentHtml),
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      const postId = inserted.id;

      const links: PromiseLike<any>[] = [];
      links.push(
        supabase.from("blog_post_categories").insert(
          selectedCategoryIds.map((categoryId) => ({ post_id: postId, category_id: categoryId }))
        )
      );

      if (finalTagIds.length > 0) {
        links.push(
          supabase.from("blog_post_tags").insert(finalTagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })))
        );
      }

      const linkResults = await Promise.all(links as any);
      const linkErr = (linkResults as any[]).find((r) => r?.error)?.error;
      if (linkErr) throw linkErr;

      toast({ title: "Post tersimpan", description: `Status: ${nextStatus}` });
      navigate("/dashboard/admin/website/blog", { replace: true });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan post", description: e?.message || "Terjadi kesalahan." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Add New Post</h1>
          <p className="text-sm text-muted-foreground">Buat post blog (full page).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => { void savePost("draft"); }} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="button" onClick={() => { void savePost(status); }} disabled={saving}>
            <Eye className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : status === "published" ? "Publish" : status === "scheduled" ? "Schedule" : "Save"}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Minimal Post Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul artikel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug / URL*</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="contoh: welcome-to-our-blog"
              />
              <p className="text-xs text-muted-foreground">Disarankan: huruf kecil, tanpa spasi (auto dari title, bisa diedit).</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Content*</Label>
              <RichTextEditor
                value={contentHtml}
                onChange={setContentHtml}
                onSave={() => { /* saving handled by bottom buttons */ }}
                title="Content"
                description=""
                icon={Save}
                showTopBar={false}
                showSaveControls={false}
                isEditing
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="excerpt">Excerpt / Summary*</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan singkat (dipakai untuk listing/preview)."
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="featuredImageUrl">Featured Image URL</Label>
              <Input
                id="featuredImageUrl"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="featuredImageAlt">Alt Text Image</Label>
              <Input
                id="featuredImageAlt"
                value={featuredImageAlt}
                onChange={(e) => setFeaturedImageAlt(e.target.value)}
                placeholder="Deskripsi gambar (SEO & aksesibilitas)"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status*</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Author</Label>
              <Input value={authorId ? "(current user)" : "-"} disabled />
              <p className="text-xs text-muted-foreground">Default mengikuti user yang login.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publishAt">Publish Date & Time</Label>
              <Input
                id="publishAt"
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                disabled={status !== "scheduled"}
              />
              <p className="text-xs text-muted-foreground">Aktif jika status Scheduled.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label>Categories*</Label>
                <p className="text-xs text-muted-foreground">Minimal 1 kategori wajib.</p>
              </div>
              <div className="grid gap-2 rounded-md border border-border p-3">
                {categories.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada kategori.</div>
                ) : (
                  categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedCategoryIds.includes(c.id)}
                        onCheckedChange={() => setSelectedCategoryIds((prev) => toggleId(prev, c.id))}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Tags (opsional)</Label>
                <p className="text-xs text-muted-foreground">Pilih dari daftar, atau ketik baru (pisahkan dengan koma).</p>
              </div>

              <div className="space-y-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="contoh: marketing, seo, tips"
                />
                <div className="grid gap-2 rounded-md border border-border p-3 max-h-[240px] overflow-auto">
                  {tags.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Belum ada tags.</div>
                  ) : (
                    tags.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedTagIds.includes(t.id)}
                          onCheckedChange={() => setSelectedTagIds((prev) => toggleId(prev, t.id))}
                        />
                        <span>{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title*</Label>
              <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              <p className="text-xs text-muted-foreground">Disarankan &lt; 60 karakter (judul SEO).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description* (max 160)</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Deskripsi singkat untuk snippet Google & share."
              />
              <div className="text-xs text-muted-foreground">{metaDescription.trim().length}/160</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
