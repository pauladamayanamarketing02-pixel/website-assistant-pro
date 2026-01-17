import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ImageUploadField from "./ImageUploadField";

export type BusinessOption = { id: string; name: string };
export type LookupOption = { id: string; name: string };

type Props = {
  businesses: BusinessOption[];
  categories: LookupOption[];
  contentTypes: LookupOption[];
  onBack: () => void;
  onSaved: () => void;
  onManageCategories: () => void;
  onManageContentTypes: () => void;
};

export default function AddContentItemPage({
  businesses,
  categories,
  contentTypes,
  onBack,
  onSaved,
  onManageCategories,
  onManageContentTypes,
}: Props) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [saving, setSaving] = React.useState(false);

  const [businessId, setBusinessId] = React.useState<string>("");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [contentTypeId, setContentTypeId] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [imagePrimaryUrl, setImagePrimaryUrl] = React.useState("");
  const [imageSecondUrl, setImageSecondUrl] = React.useState("");
  const [imageThirdUrl, setImageThirdUrl] = React.useState("");

  const folderPrefix = React.useMemo(() => {
    const b = businessId || "unassigned";
    return `content-items/${b}`;
  }, [businessId]);

  const save = async () => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Not signed in" });
      return;
    }
    if (!businessId || !categoryId || !contentTypeId || !title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Business, Category, Content Type, and Title are required.",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await (supabase as any).from("content_items").insert({
        business_id: businessId,
        category_id: categoryId,
        content_type_id: contentTypeId,
        title: title.trim(),
        description: description.trim() || null,
        image_primary_url: imagePrimaryUrl || null,
        image_second_url: imageSecondUrl || null,
        image_third_url: imageThirdUrl || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({ title: "Saved", description: "Content item added to Content Management." });
      onSaved();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err?.message ?? "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Add Content</h1>
          <p className="text-muted-foreground">Create a new content item for a business.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Select value={businessId} onValueChange={setBusinessId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border border-border">
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Business ID</Label>
                  <Input value={businessId} disabled placeholder="Auto-filled" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Category</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={onManageCategories}>
                      Manage
                    </Button>
                  </div>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border border-border">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Content Type</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={onManageContentTypes}>
                      Manage
                    </Button>
                  </div>
                  <Select value={contentTypeId} onValueChange={setContentTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a content type" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border border-border">
                      {contentTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Content description"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Images</h2>
          <div className="space-y-3">
            <ImageUploadField
              label="Primary"
              value={imagePrimaryUrl}
              onChange={setImagePrimaryUrl}
              folderPrefix={folderPrefix}
            />
            <ImageUploadField
              label="Second"
              value={imageSecondUrl}
              onChange={setImageSecondUrl}
              folderPrefix={folderPrefix}
            />
            <ImageUploadField
              label="Third"
              value={imageThirdUrl}
              onChange={setImageThirdUrl}
              folderPrefix={folderPrefix}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
