import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  initialValue?: string;
  onSubmit: (domain: string) => void;
  className?: string;
};

function normalizeDomain(raw: string) {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if (v.includes(" ")) return v.replace(/\s+/g, "");
  if (v.includes(".")) return v;
  return `${v}.com`;
}

export function DomainSearchBar({ initialValue = "", onSubmit, className }: Props) {
  const [value, setValue] = useState(() => initialValue.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  const normalizedPreview = useMemo(() => normalizeDomain(value), [value]);

  return (
    <form
      className={cn(
        "w-full rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 shadow-soft",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        const domain = normalizeDomain(value);
        if (!domain) return;
        onSubmit(domain);
      }}
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter your domain name"
            className="h-12 text-base sm:h-14 sm:text-lg"
            aria-label="Domain name"
          />
        </div>

        <Button type="submit" size="lg" className="h-12 sm:h-14 sm:px-8">
          Search Domain
        </Button>
      </div>

      <div className="px-4 pb-3 text-xs text-muted-foreground">
        {normalizedPreview ? (
          <span>
            Example: <span className="font-medium text-foreground">{normalizedPreview}</span>
          </span>
        ) : (
          <span>Press Enter to search</span>
        )}
      </div>
    </form>
  );
}
