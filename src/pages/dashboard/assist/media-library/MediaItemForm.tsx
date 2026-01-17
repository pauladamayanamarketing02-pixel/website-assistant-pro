import * as React from "react";

import { ArrowLeft, Type } from "lucide-react";

import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type BusinessOption = {
  id: string;
  name: string;
  publicId: string;
};

type Props = {
  businesses: BusinessOption[];
  categories: string[];
  mediaTypes: string[];
  onCancel: () => void;
  onSave: (payload: {
    businessId: string;
    businessName: string;
    category: string;
    mediaType: string;
    title: string;
    description: string;
  }) => void;
};

export default function MediaItemForm({ businesses, categories, mediaTypes, onCancel, onSave }: Props) {
  const { toast } = useToast();

  const [businessId, setBusinessId] = React.useState<string>("");
  const business = React.useMemo(() => businesses.find((b) => b.id === businessId), [businessId, businesses]);
  const businessName = business?.name ?? "";
  const businessPublicId = business?.publicId ?? "";

  const [category, setCategory] = React.useState<string>("");
  const [mediaType, setMediaType] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");

  const handleSave = () => {
    const descriptionText = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const missing: string[] = [];
    if (!businessId) missing.push("Business Name");
    if (!category) missing.push("Category");
    if (!mediaType) missing.push("Type Content");
    if (!descriptionText) missing.push("Description");

    if (missing.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: `Please fill: ${missing.join(", ")}.`,
      });
      return;
    }

    onSave({
      businessId,
      businessName,
      category,
      mediaType,
      title,
      description,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5"
            onClick={onCancel}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Add Media</h1>
            <p className="text-muted-foreground">Create a new media record for a client.</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name*</Label>
              <Select value={businessId || undefined} onValueChange={setBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Business Name" />
                </SelectTrigger>
                <SelectContent className="z-50">
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
              <Input value={businessPublicId} disabled />
            </div>

            <div className="space-y-2">
              <Label>Category*</Label>
              <Select value={category || undefined} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Category" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type Content*</Label>
              <Select value={mediaType || undefined} onValueChange={setMediaType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Type Content" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {mediaTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Media title..." />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Description*</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                onSave={() => {}}
                isEditing
                saving={false}
                title="Description"
                description="Write the media description."
                icon={Type}
                showTopBar={false}
                showSaveControls={false}
              />
            </div>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
