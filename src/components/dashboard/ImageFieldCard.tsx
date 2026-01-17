import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Props = {
  label: string;
  value: string;
  originalValue: string;
  onChange: (next: { url: string; originalUrl: string }) => void;
  variant?: "default" | "compact";
};

export default function ImageFieldCard({
  label,
  value,
  originalValue,
  onChange,
  variant = "default",
}: Props) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [urlDialogOpen, setUrlDialogOpen] = React.useState(false);
  const [draftUrl, setDraftUrl] = React.useState(value);

  React.useEffect(() => {
    setDraftUrl(value);
  }, [value]);

  const preview = () => {
    if (!value) return;
    window.open(value, "_blank", "noopener,noreferrer");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: "URL copied to clipboard." });
    } catch {
      toast({ title: "Failed", description: "Unable to copy the URL in this browser." });
    }
  };

  const reset = () => {
    onChange({ url: originalValue, originalUrl: originalValue });
    toast({ title: "Reset", description: `${label} reverted to the original.` });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    onChange({ url: nextUrl, originalUrl: originalValue });

    toast({
      title: "Image updated",
      description: `${label} updated from a local file (preview only).`,
    });
  };

  const saveUrl = () => {
    const next = draftUrl.trim();
    if (!next) return;
    onChange({ url: next, originalUrl: originalValue });
    setUrlDialogOpen(false);
    toast({ title: "Image updated", description: `${label} updated via URL.` });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className={variant === "compact" ? "text-sm" : "text-base"}>{label}</CardTitle>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={preview}>
            Preview
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copyUrl}>
            Copy URL
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setUrlDialogOpen(true)}>
            Change Image
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={openFilePicker}>
            Add From Computer
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            Reset to Original
          </Button>
        </div>
      </CardHeader>

      <CardContent className={variant === "compact" ? "space-y-2" : "space-y-3"}>
        <div className="overflow-hidden rounded-md border">
          <img
            src={value || "/placeholder.svg"}
            alt={`${label} image preview`}
            loading="lazy"
            className={variant === "compact" ? "h-24 w-full object-cover" : "h-48 w-full object-cover"}
          />
        </div>

        <div className="space-y-2">
          <Label>Current URL</Label>
          <Input value={value} readOnly />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
      </CardContent>

      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Change Image URL</DialogTitle>
            <DialogDescription>Paste a new image URL for {label}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="https://..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUrlDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveUrl}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
