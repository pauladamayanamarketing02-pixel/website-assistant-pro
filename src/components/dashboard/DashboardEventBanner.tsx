import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  defaultDashboardBannerSettings,
  sanitizeDashboardBannerSettings,
  type DashboardBanner,
  type DashboardBannerAudience,
  type DashboardBannerSettings,
} from "@/pages/dashboard/admin/dashboard-banners/types";

const SETTINGS_KEY = "dashboard_banners";

function isBannerActive(banner: DashboardBanner, now: Date, audience: DashboardBannerAudience) {
  if (banner.isPublished === false) return false;

  const shouldShow = audience === "user" ? banner.showOnUserOverview === true : banner.showOnAssistOverview === true;
  if (!shouldShow) return false;

  const start = banner.startsAt ? new Date(banner.startsAt) : null;
  const end = banner.endsAt ? new Date(banner.endsAt) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export function DashboardEventBanner({ audience, className }: { audience: DashboardBannerAudience; className?: string }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DashboardBannerSettings>(defaultDashboardBannerSettings);

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
        console.error("Failed to load dashboard banners", error);
        setSettings(defaultDashboardBannerSettings);
      } else {
        setSettings(sanitizeDashboardBannerSettings(data?.value));
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const activeBanner = useMemo(() => {
    const now = new Date();
    const active = (settings.banners ?? []).filter((b) => isBannerActive(b, now, audience));
    // newer (later startsAt) wins
    active.sort((a, b) => String(b.startsAt ?? "").localeCompare(String(a.startsAt ?? "")));
    return active[0] ?? null;
  }, [audience, settings.banners]);

  if (loading || !activeBanner) return null;

  const marqueeText = [activeBanner.title, activeBanner.subtitle].filter(Boolean).join(" — ");
  const textEffect = (activeBanner as any).textEffect ?? "marquee";

  return (
    <div className={cn(className)}>
      <Card className="border border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {textEffect === "marquee" ? (
              <>
                {/* Marquee text: scrolls without shifting the overall page layout */}
                <div className="relative overflow-hidden whitespace-nowrap">
                  <div className="dashboard-banner-marquee motion-reduce:animate-none">
                    <span className="text-sm font-semibold text-foreground">{marqueeText}</span>
                    <span className="px-8 text-muted-foreground">•</span>
                    <span className="text-sm font-semibold text-foreground">{marqueeText}</span>
                    <span className="px-8 text-muted-foreground">•</span>
                    <span className="text-sm font-semibold text-foreground">{marqueeText}</span>
                  </div>
                </div>

                <style>
                  {`
                    .dashboard-banner-marquee {
                      display: inline-flex;
                      align-items: center;
                      gap: 0;
                      will-change: transform;
                      animation: dashboard-banner-marquee 18s linear infinite;
                    }

                    @keyframes dashboard-banner-marquee {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-33.333%); }
                    }

                    @media (prefers-reduced-motion: reduce) {
                      .dashboard-banner-marquee { animation: none; }
                    }
                  `}
                </style>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    "text-sm font-semibold text-foreground",
                    textEffect === "pulse" ? "motion-reduce:animate-none animate-pulse" : null,
                    textEffect === "blink" ? "dashboard-banner-blink motion-reduce:animate-none" : null
                  )}
                >
                  {marqueeText}
                </div>

                <style>
                  {`
                    .dashboard-banner-blink {
                      animation: dashboard-banner-blink 1s step-end infinite;
                    }

                    @keyframes dashboard-banner-blink {
                      0%, 49% { opacity: 1; }
                      50%, 100% { opacity: 0.15; }
                    }

                    @media (prefers-reduced-motion: reduce) {
                      .dashboard-banner-blink { animation: none; }
                    }
                  `}
                </style>
              </>
            )}
          </div>

          {activeBanner.ctaLabel && activeBanner.ctaHref ? (
            <Button asChild size="sm">
              <a href={activeBanner.ctaHref}>{activeBanner.ctaLabel}</a>
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
