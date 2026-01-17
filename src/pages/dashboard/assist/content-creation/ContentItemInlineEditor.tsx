import * as React from "react";

import { Pencil, Trash2 } from "lucide-react";

import ImageFieldCard from "@/components/dashboard/ImageFieldCard";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import PlatformDropdown from "@/pages/dashboard/assist/content-creation/PlatformDropdown";

export type ContentItemInlineEditValues = {
  title: string;
  description: string;
  category: string;
  contentType: string;
  platform: string;
  scheduledAt: string; // datetime-local
  primaryImageUrl: string;
  secondaryImageUrl: string;
  thirdImageUrl: string;
};

type ImageSlotState = { url: string; originalUrl: string };

type Props = {
  categories: string[];
  contentTypes: string[];
  initialValues: ContentItemInlineEditValues;
  mode?: "view" | "edit";
  saving?: boolean;
  onEdit?: () => void;
  onSave: (values: ContentItemInlineEditValues) => void;
  onCancel: () => void;
  onDelete: () => void;
};

export default function ContentItemInlineEditor({
  categories,
  contentTypes,
  initialValues,
  mode = "edit",
  saving,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const [values, setValues] = React.useState<ContentItemInlineEditValues>(initialValues);
  const [images, setImages] = React.useState<{
    primary: ImageSlotState;
    secondary: ImageSlotState;
    third: ImageSlotState;
  }>({
    primary: { url: initialValues.primaryImageUrl, originalUrl: initialValues.primaryImageUrl },
    secondary: { url: initialValues.secondaryImageUrl, originalUrl: initialValues.secondaryImageUrl },
    third: { url: initialValues.thirdImageUrl, originalUrl: initialValues.thirdImageUrl },
  });

  React.useEffect(() => {
    setValues(initialValues);
    setImages({
      primary: { url: initialValues.primaryImageUrl, originalUrl: initialValues.primaryImageUrl },
      secondary: { url: initialValues.secondaryImageUrl, originalUrl: initialValues.secondaryImageUrl },
      third: { url: initialValues.thirdImageUrl, originalUrl: initialValues.thirdImageUrl },
    });
  }, [initialValues]);

  const isEditing = mode === "edit";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{isEditing ? "Edit Mode" : "View Details"}</p>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : null}

          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_4fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Images</p>
          <div className="grid gap-3">
            <ImageFieldCard
              variant="compact"
              label="Primary Image"
              value={images.primary.url}
              originalValue={images.primary.originalUrl}
              actions={isEditing ? "edit" : "view"}
              onChange={(next) => setImages((p) => ({ ...p, primary: next }))}
            />
            <ImageFieldCard
              variant="compact"
              label="Secondary Image"
              value={images.secondary.url}
              originalValue={images.secondary.originalUrl}
              actions={isEditing ? "edit" : "view"}
              onChange={(next) => setImages((p) => ({ ...p, secondary: next }))}
            />
            <ImageFieldCard
              variant="compact"
              label="Third Image"
              value={images.third.url}
              originalValue={images.third.originalUrl}
              actions={isEditing ? "edit" : "view"}
              onChange={(next) => setImages((p) => ({ ...p, third: next }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={values.title}
                disabled={!isEditing}
                onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={values.category || undefined}
                onValueChange={(v) => setValues((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger disabled={!isEditing}>
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
              <Label>Type Content</Label>
              <Select
                value={values.contentType || undefined}
                onValueChange={(v) => setValues((p) => ({ ...p, contentType: v, platform: "" }))}
              >
                <SelectTrigger disabled={!isEditing}>
                  <SelectValue placeholder="Choose Type Content" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {contentTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PlatformDropdown
              contentType={values.contentType}
              value={values.platform}
              disabled={!isEditing}
              onChange={(v) => setValues((p) => ({ ...p, platform: v }))}
            />

            <div className="space-y-2">
              <Label>Scheduled</Label>
              <Input
                type="datetime-local"
                value={values.scheduledAt}
                disabled={!isEditing}
                onChange={(e) => setValues((p) => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <RichTextEditor
                value={values.description}
                onChange={(v) => setValues((p) => ({ ...p, description: v }))}
                onSave={() => {}}
                isEditing
                saving={false}
                title="Description"
                description="Write the content description."
                icon={Pencil}
                showTopBar={false}
                showSaveControls={false}
              />
            ) : (
              <div
                className="rounded-md border bg-background p-3 text-sm text-foreground"
                dangerouslySetInnerHTML={{ __html: values.description || "" }}
              />
            )}
          </div>

          {isEditing ? (
            <>
              <Separator />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={Boolean(saving)}
                  onClick={() =>
                    onSave({
                      ...values,
                      primaryImageUrl: images.primary.url,
                      secondaryImageUrl: images.secondary.url,
                      thirdImageUrl: images.third.url,
                    })
                  }
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
