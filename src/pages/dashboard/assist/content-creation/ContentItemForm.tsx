import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BusinessOption = {
  id: string;
  name: string;
};

type Props = {
  businesses: BusinessOption[];
  categories: string[];
  contentTypes: string[];
  onCancel: () => void;
  onSave: (payload: {
    businessId: string;
    businessName: string;
    category: string;
    contentType: string;
    title: string;
    description: string;
    scheduledAt: string;
  }) => void;
};

export default function ContentItemForm({
  businesses,
  categories,
  contentTypes,
  onCancel,
  onSave,
}: Props) {
  const [businessId, setBusinessId] = React.useState<string>(businesses[0]?.id ?? "");
  const businessName = React.useMemo(
    () => businesses.find((b) => b.id === businessId)?.name ?? "",
    [businessId, businesses],
  );

  const [category, setCategory] = React.useState<string>(categories[0] ?? "");
  const [contentType, setContentType] = React.useState<string>(contentTypes[0] ?? "");
  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [scheduledAt, setScheduledAt] = React.useState<string>("");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Add Content</h1>
          <p className="text-muted-foreground">Create a new content item for a client.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={onCancel}>
            Back
          </Button>
          <Button
            type="button"
            onClick={() =>
              onSave({
                businessId,
                businessName,
                category,
                contentType,
                title,
                description,
                scheduledAt,
              })
            }
          >
            Save
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Business</Label>
              <Select value={businessId} onValueChange={setBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business" />
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
              <Input value={businessId} readOnly />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Business Name</Label>
              <Input value={businessName} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title..." />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Scheduled</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
