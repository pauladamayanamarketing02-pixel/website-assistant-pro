import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BlogStatus = "published" | "scheduled" | "draft";

type BlogPostRow = {
  id: string;
  title: string;
  author: string;
  categories: string[];
  tags: string[];
  date: string; // ISO or display string
  status: BlogStatus;
};

const statusLabel: Record<BlogStatus, string> = {
  published: "Published",
  scheduled: "Scheduled",
  draft: "Draft",
};

export default function AdminWebsiteBlog() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | BlogStatus>("all");

  const posts: BlogPostRow[] = useMemo(
    () => [
      {
        id: "p1",
        title: "Welcome to Our Blog",
        author: "Admin",
        categories: ["General"],
        tags: ["intro", "news"],
        date: "2026-01-10",
        status: "published",
      },
      {
        id: "p2",
        title: "January Content Plan",
        author: "Admin",
        categories: ["Marketing"],
        tags: ["plan", "content"],
        date: "2026-01-20",
        status: "scheduled",
      },
      {
        id: "p3",
        title: "How We Work (Draft)",
        author: "Admin",
        categories: ["Company"],
        tags: ["process"],
        date: "2026-01-12",
        status: "draft",
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.status === filter);
  }, [filter, posts]);

  const handleAddNew = (type: "post" | "author" | "categories" | "tags") => {
    if (type === "post") {
      navigate("/dashboard/admin/website/blog/new");
      return;
    }
    // TODO: routes for author/categories/tags management
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Posts</h1>
          <p className="text-sm text-muted-foreground">Manage blog posts: create, review, and publish.</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 bg-popover">
            <DropdownMenuItem onClick={() => handleAddNew("post")}>Post</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddNew("author")}>Author</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddNew("categories")}>Categories</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddNew("tags")}>Tags</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Blog Posts</CardTitle>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No posts match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{post.title}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {statusLabel[post.status]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell className="text-muted-foreground">{post.categories.join(", ") || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{post.tags.join(", ") || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{post.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => {}}>
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
