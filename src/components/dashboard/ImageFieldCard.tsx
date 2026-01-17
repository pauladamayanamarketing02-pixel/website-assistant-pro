import * as React from "react";

import { Eye, Copy, Link2, Upload, RotateCcw } from "lucide-react";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type Props = {
  label: string;
  value: string;
  originalValue: string;
  onChange: (next: { url: string; originalUrl: string }) => void;
  variant?: "default" | "compact";
};

function IconActionButton({
  label,
  onClick,
  icon,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

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
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className={variant === "compact" ? "text-sm" : "text-base"}>{label}</CardTitle>
        <TooltipProvider delayDuration={150}>
          <div className="flex flex-wrap justify-end gap-2">
            <IconActionButton label="Preview" onClick={preview} icon={<Eye className="h-4 w-4" />} disabled={!value} />
            <IconActionButton label="Copy URL" onClick={() => void copyUrl()} icon={<Copy className="h-4 w-4" />} disabled={!value} />
            <IconActionButton
              label="Change Image"
              onClick={() => setUrlDialogOpen(true)}
              icon={<Link2 className="h-4 w-4" />}
            />
            <IconActionButton
              label="Add From Computer"
              onClick={openFilePicker}
              icon={<Upload className="h-4 w-4" />}
            />
            <IconActionButton
              label="Reset to Original"
              onClick={reset}
              icon={<RotateCcw className="h-4 w-4" />}
            />
          </div>
        </TooltipProvider>
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
