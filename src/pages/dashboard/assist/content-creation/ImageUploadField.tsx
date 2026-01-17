import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folderPrefix: string;
};

function getFileExt(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "bin";
}

export default function ImageUploadField({ label, value, onChange, folderPrefix }: Props) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const pick = () => inputRef.current?.click();

  const upload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const ext = getFileExt(file.name);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${folderPrefix}/${Date.now()}-${crypto.randomUUID()}.${ext}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from("user-files").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) throw new Error("Failed to get public URL");

      onChange(publicUrl);
      toast({ title: "Uploaded", description: `${label} image uploaded.` });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err?.message ?? "Please try again.",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    onChange("");
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{label}</CardTitle>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={pick} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={remove} disabled={!value}>
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-md border border-border">
          <img
            src={value || "/placeholder.svg"}
            alt={`${label} preview`}
            loading="lazy"
            className="h-48 w-full object-cover"
          />
        </div>

        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input value={value} readOnly placeholder="No image uploaded" />
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      </CardContent>
    </Card>
  );
}
