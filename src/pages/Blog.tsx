import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";

type BlogListItem = {
  id: string;
  title: string;
  excerpt: string | null;
  created_at: string;
  publish_at: string | null;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content_type: string;
};

export default function Blog() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id,title,excerpt,created_at,publish_at,reading_time_minutes,featured_image_url,featured_image_alt,content_type"
        )
        .eq("status", "published")
        .eq("visibility", "public")
        .is("deleted_at", null)
        .eq("no_index", false)
        .order("publish_at", { ascending: false, nullsFirst: false });

      if (cancelled) return;

      if (error) {
        // Jika ada error (mis. RLS / jaringan), kita tetap render halaman tanpa crash.
        console.error("Failed to load blog posts", error);
        setPosts([]);
      } else {
        setPosts((data as BlogListItem[]) ?? []);
      }
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => posts, [posts]);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Marketing Tips & <span className="text-gradient">Insights</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical advice to help you grow your business online. No jargon, just helpful tips.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  className="overflow-hidden shadow-soft animate-pulse"
                >
                  <div className="aspect-video bg-muted" />
                  <CardHeader className="pb-2">
                    <div className="h-5 w-24 rounded bg-muted" />
                    <div className="mt-3 h-6 w-4/5 rounded bg-muted" />
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="h-4 w-40 rounded bg-muted" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              cards.map((post, index) => {
                const publishedDate = post.publish_at ?? post.created_at;
                const dateLabel = format(new Date(publishedDate), "MMM d, yyyy");
                const readTimeLabel = post.reading_time_minutes
                  ? `${post.reading_time_minutes} min read`
                  : "";

                return (
                  <Card
                    key={post.id}
                    className="overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.featured_image_url ?? "/placeholder.svg"}
                        alt={post.featured_image_alt ?? post.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <Badge variant="secondary" className="w-fit text-xs">
                        {post.content_type}
                      </Badge>
                      <h3 className="text-xl font-semibold text-foreground mt-2 line-clamp-2">
                        {post.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {post.excerpt ?? ""}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateLabel}
                        </span>
                        {readTimeLabel ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readTimeLabel}
                          </span>
                        ) : null}
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0">
                        Read More
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Get Marketing Tips in Your Inbox
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join our newsletter for weekly tips on growing your business online.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}