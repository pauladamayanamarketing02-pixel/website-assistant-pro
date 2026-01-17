import * as React from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  contentType: string;
  value: string;
  onChange: (next: string) => void;
};

const SOCIAL_MEDIA_PLATFORMS = ["Facebook", "Instagram", "X / Twitter", "Linkedin", "Reddit"] as const;
const ADS_PLATFORMS = ["Facebook Ads", "Instagram Ads", "Google Ads", "YouTube Ads"] as const;

function getPlatforms(contentType: string): readonly string[] {
  if (contentType === "Social Media Posts") return SOCIAL_MEDIA_PLATFORMS;
  if (contentType === "Ads Marketing") return ADS_PLATFORMS;
  return [];
}

export default function PlatformDropdown({ contentType, value, onChange }: Props) {
  const platforms = React.useMemo(() => getPlatforms(contentType), [contentType]);

  if (platforms.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Platform</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose Platform" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {platforms.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
