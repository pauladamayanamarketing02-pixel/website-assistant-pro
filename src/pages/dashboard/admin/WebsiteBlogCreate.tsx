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
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";

import type { Database } from "@/integrations/supabase/types";
import { AuthorPicker } from "@/components/blog/AuthorPicker";
import { CategoriesPanel, type BlogCategoryRow } from "@/components/blog/CategoriesPanel";
import { TagsInput, type BlogTagRow } from "@/components/blog/TagsInput";
import { WebsiteMediaPickerDialog } from "@/components/media/WebsiteMediaPickerDialog";


type BlogPostStatus = Database["public"]["Enums"]["blog_post_status"];

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

  // system author for RLS (must equal auth.uid())
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [authorDisplay, setAuthorDisplay] = useState<string>("");

  // blog-facing author (managed in blog_authors table)
  const [blogAuthorId, setBlogAuthorId] = useState<string | null>(null);
  const [blogAuthorLabel, setBlogAuthorLabel] = useState<string>("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [excerpt, setExcerpt] = useState("");

  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [featuredPickerOpen, setFeaturedPickerOpen] = useState(false);

  const [status, setStatus] = useState<BlogPostStatus>("draft");
  const [publishAt, setPublishAt] = useState<string>(""); // datetime-local


  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [categories, setCategories] = useState<BlogCategoryRow[]>([]);
  const [tags, setTags] = useState<BlogTagRow[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const slugFromTitle = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    // slug harus selalu auto-sync dari title dan tidak editable
    setSlug(slugFromTitle);
    setMetaTitle((prev) => (prev ? prev : title));
  }, [slugFromTitle, title]);

  const loadCatsTags = async () => {
    const [{ data: cats, error: catsErr }, { data: tagsData, error: tagsErr }] = await Promise.all([
      supabase
        .from("blog_categories")
        .select("id,name,slug,parent_id,is_locked")
        .order("name", { ascending: true }),
      supabase.from("blog_tags").select("id,name,slug").order("name", { ascending: true }),
    ]);

    if (catsErr) throw catsErr;
    if (tagsErr) throw tagsErr;

    setCategories(((cats as any[]) ?? []) as BlogCategoryRow[]);
    setTags(((tagsData as any[]) ?? []) as BlogTagRow[]);
  };

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const uid = userData.user?.id ?? null;
        setAuthorId(uid);

        if (uid) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name,email")
            .eq("id", uid)
            .maybeSingle<Pick<ProfileRow, "name" | "email">>();

          setAuthorDisplay(profile?.name || profile?.email || userData.user?.email || uid);
        } else {
          setAuthorDisplay("");
        }

        await loadCatsTags();
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

  const validate = () => {
    if (!authorId) {
      toast({ variant: "destructive", title: "Author tidak ditemukan (silakan login ulang)" });
      return false;
    }
    if (!blogAuthorId) {
      toast({ variant: "destructive", title: "Author (publik) wajib dipilih" });
      return false;
    }
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Title wajib diisi" });
      return false;
    }
    if (!slug.trim()) {
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
      const nowIso = new Date().toISOString();
      const publishAtIso =
        nextStatus === "scheduled"
          ? new Date(publishAt).toISOString()
          : nextStatus === "published"
            ? nowIso
            : null;

      const insertPayload: any = {
        author_id: authorId as string, // required by RLS
        blog_author_id: blogAuthorId,
        title: title.trim(),
        slug: slug,
        content_html: contentHtml,
        excerpt: excerpt.trim(),
        featured_image_url: featuredImageUrl.trim() || null,
        featured_image_alt: featuredImageAlt.trim() || null,
        status: nextStatus,
        publish_at: publishAtIso,
        meta_title: metaTitle.trim(),
        meta_description: metaDescription.trim(),
        reading_time_minutes: estimateReadingTimeMinutes(contentHtml),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("blog_posts")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      const postId = inserted?.id as string | undefined;
      if (!postId) throw new Error("Gagal mendapatkan ID post.");

      if (selectedCategoryIds.length) {
        const { error: catsLinkErr } = await supabase.from("blog_post_categories").insert(
          selectedCategoryIds.map((categoryId) => ({
            post_id: postId,
            category_id: categoryId,
          }))
        );
        if (catsLinkErr) throw catsLinkErr;
      }

      if (selectedTagIds.length) {
        const { error: tagsLinkErr } = await supabase.from("blog_post_tags").insert(
          selectedTagIds.map((tagId) => ({
            post_id: postId,
            tag_id: tagId,
          }))
        );
        if (tagsLinkErr) throw tagsLinkErr;
      }

      toast({ title: "Post tersimpan", description: `Status: ${nextStatus}` });
      navigate("/dashboard/admin/website/blog", { replace: true });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan post",
        description: e?.message || "Terjadi kesalahan.",
      });
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
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Add New Post</h1>
          </div>
          <p className="text-sm text-muted-foreground">Buat post blog (untuk halaman Blog / halaman utama).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => void savePost("draft")} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="button" onClick={() => void savePost(status)} disabled={saving}>
            <Eye className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : status === "published" ? "Publish" : status === "scheduled" ? "Schedule" : "Save"}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul artikel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug / URL*</Label>
              <Input id="slug" value={slug} disabled placeholder="auto dari title" />
              <p className="text-xs text-muted-foreground">Otomatis dari title (tidak bisa diedit).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemAuthor">System Author (login)</Label>
              <Input id="systemAuthor" value={authorDisplay} disabled placeholder="-" />
              <p className="text-xs text-muted-foreground">Dipakai untuk izin (RLS). Tidak tampil ke publik.</p>
            </div>

            <AuthorPicker
              value={blogAuthorId}
              onChange={(id, label) => {
                setBlogAuthorId(id);
                setBlogAuthorLabel(label);
              }}
              label="Author (publik)"
              placeholder="Pilih author untuk tampil di blog"
            />

            <CategoriesPanel
              categories={categories}
              selectedIds={selectedCategoryIds}
              onSelectedIdsChange={setSelectedCategoryIds}
              onCreated={() => {
                void loadCatsTags();
              }}
              onDeleted={() => {
                void loadCatsTags();
              }}
            />

            <TagsInput
              tags={tags}
              selectedIds={selectedTagIds}
              onSelectedIdsChange={setSelectedTagIds}
              onTagsChange={(next) => setTags(next)}
            />

            <div className="space-y-2 md:col-span-2">
              <Label>Content*</Label>
              <RichTextEditor
                value={contentHtml}
                onChange={setContentHtml}
                onSave={() => {
                  /* saving handled by bottom buttons */
                }}
                title="Content"
                description=""
                icon={Save}
                showTopBar={false}
                showSaveControls={false}
                isEditing
                enableImageInsert
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
              <Label>Featured Image</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setFeaturedPickerOpen(true)}>
                  Set Featured Image
                </Button>
                {featuredImageUrl ? (
                  <Button type="button" variant="ghost" onClick={() => setFeaturedImageUrl("")}>
                    Clear
                  </Button>
                ) : null}
              </div>
              {featuredImageUrl ? (
                <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted">
                  <img
                    src={featuredImageUrl}
                    alt={featuredImageAlt || "Featured image preview"}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Belum ada featured image.</p>
              )}

              <WebsiteMediaPickerDialog
                open={featuredPickerOpen}
                onOpenChange={setFeaturedPickerOpen}
                title="Set featured image"
                accept="image/*"
                onPick={(pick) => {
                  setFeaturedImageUrl(pick.url);
                  if (!featuredImageAlt.trim() && pick.name) setFeaturedImageAlt(pick.name);
                }}
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


          <div className="grid gap-6 md:grid-cols-2">
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
