import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  defaultWebsiteLayoutSettings,
  sanitizeWebsiteLayoutSettings,
  type WebsiteLayoutSettings,
} from "@/pages/dashboard/admin/website-layout/types";

const SETTINGS_KEY = "website_layout";

export function useWebsiteLayoutSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WebsiteLayoutSettings>(defaultWebsiteLayoutSettings);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("website_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load website layout settings", error);
        setSettings(defaultWebsiteLayoutSettings);
      } else {
        setSettings(sanitizeWebsiteLayoutSettings(data?.value));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({ settings, loading }),
    [settings, loading]
  );
}
