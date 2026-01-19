import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type HomepagePromo = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  startsAt?: string | null; // ISO
  endsAt?: string | null; // ISO
  isPublished?: boolean;
};

const SETTINGS_KEY = "homepage_promos";

type PromoSettings = {
  promos: HomepagePromo[];
};

function safeParseSettings(value: unknown): PromoSettings {
  if (!value || typeof value !== "object") return { promos: [] };
  const v = value as any;
  const promos = Array.isArray(v.promos) ? v.promos : [];
  return { promos };
}

function isPromoActive(promo: HomepagePromo, now: Date) {
  if (promo.isPublished === false) return false;

  const start = promo.startsAt ? new Date(promo.startsAt) : null;
  const end = promo.endsAt ? new Date(promo.endsAt) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export function HomePromoBanner({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PromoSettings>({ promos: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("website_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Failed to load homepage promos", error);
        setSettings({ promos: [] });
      } else {
        setSettings(safeParseSettings(data?.value));
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const activePromo = useMemo(() => {
    const now = new Date();
    const active = (settings.promos ?? []).filter((p) => isPromoActive(p, now));
    // pick the one that starts the latest (closest) so newer promos win
    active.sort((a, b) => String(b.startsAt ?? "").localeCompare(String(a.startsAt ?? "")));
    return active[0] ?? null;
  }, [settings.promos]);

  if (loading || !activePromo) return null;

  return (
    <div className={cn("container", className)}>
      <Card className="border border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{activePromo.title}</div>
            {activePromo.subtitle ? (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{activePromo.subtitle}</div>
            ) : null}
          </div>

          {activePromo.ctaLabel && activePromo.ctaHref ? (
            <Button asChild size="sm">
              <a href={activePromo.ctaHref}>
                {activePromo.ctaLabel}
              </a>
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
