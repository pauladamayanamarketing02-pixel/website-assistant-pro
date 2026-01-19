import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  excerpt: string | null;
  created_at: string;
  publish_at: string | null;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content_type: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id,title,slug,content_html,excerpt,created_at,publish_at,reading_time_minutes,featured_image_url,featured_image_alt,content_type,meta_title,meta_description,canonical_url"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .eq("visibility", "public")
        .is("deleted_at", null)
        .eq("no_index", false)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load blog post", error);
        setPost(null);
        setNotFound(true);
      } else if (!data) {
        setPost(null);
        setNotFound(true);
      } else {
        setPost(data as BlogPostRow);
      }

      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const title = (post.meta_title || post.title).slice(0, 60);
    document.title = title;
  }, [post]);

  const publishedDate = useMemo(() => {
    if (!post) return null;
    return post.publish_at ?? post.created_at;
  }, [post]);

  const dateLabel = useMemo(() => {
    if (!publishedDate) return "";
    return format(new Date(publishedDate), "MMM d, yyyy");
  }, [publishedDate]);

  const readTimeLabel = useMemo(() => {
    if (!post?.reading_time_minutes) return "";
    return `${post.reading_time_minutes} min read`;
  }, [post?.reading_time_minutes]);

  return (
    <PublicLayout>
      <section className="py-10 md:py-14">
        <div className="container">
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/blog">
              <ArrowLeft />
              Back to Blog
            </Link>
          </Button>

          {loading ? (
            <Card className="shadow-soft">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardHeader className="space-y-3">
                <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                <div className="h-8 w-4/5 rounded bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="mt-2 h-4 w-11/12 rounded bg-muted animate-pulse" />
                <div className="mt-2 h-4 w-10/12 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ) : notFound ? (
            <Card className="shadow-soft">
              <CardHeader>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Post not found</h1>
                <p className="text-muted-foreground">
                  Artikel tidak ditemukan atau belum dipublikasikan.
                </p>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/blog">Kembali ke daftar blog</Link>
                </Button>
              </CardContent>
            </Card>
          ) : post ? (
            <article>
              <header className="mx-auto max-w-3xl">
                <Badge variant="secondary" className="w-fit text-xs">
                  {post.content_type}
                </Badge>
                <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {post.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {dateLabel ? (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {dateLabel}
                    </span>
                  ) : null}
                  {readTimeLabel ? (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {readTimeLabel}
                    </span>
                  ) : null}
                </div>

                {post.featured_image_url ? (
                  <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-soft">
                    <img
                      src={post.featured_image_url}
                      alt={post.featured_image_alt ?? post.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

                {post.excerpt ? (
                  <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>
                ) : null}
              </header>

              <section className="container mt-10 md:mt-14">
                <div
                  className="prose prose-sm md:prose-base max-w-3xl mx-auto prose-headings:tracking-tight prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: post.content_html }}
                />
              </section>
            </article>
          ) : null}
        </div>
      </section>
    </PublicLayout>
  );
}
