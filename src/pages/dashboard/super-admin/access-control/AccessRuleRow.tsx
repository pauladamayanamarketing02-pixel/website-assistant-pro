import { Switch } from "@/components/ui/switch";
import type { ReactNode } from "react";

type Props = {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  leading?: ReactNode;
  className?: string;
};

export function AccessRuleRow({ label, description, checked, onCheckedChange, leading, className }: Props) {
  return (
    <div className={"flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4 " + (className ?? "")}>
      <div className="min-w-0 flex items-start gap-2">
        {leading ? <div className="mt-0.5 shrink-0">{leading}</div> : null}
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
        </div>
      </div>

      <Switch checked={Boolean(checked)} onCheckedChange={(v) => onCheckedChange(Boolean(v))} />
    </div>
  );
}
