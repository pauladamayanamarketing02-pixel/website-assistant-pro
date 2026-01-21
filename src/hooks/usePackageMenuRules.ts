import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MenuKey = "ai_agents" | "messages" | "content_planner" | "reporting";

const CONTROLLED_KEYS: MenuKey[] = ["ai_agents", "messages", "content_planner", "reporting"];

type RuleRow = {
  menu_key: string;
  is_enabled: boolean;
};

export function usePackageMenuRules(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [enabledByKey, setEnabledByKey] = useState<Record<MenuKey, boolean> | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const { data: activePkg } = await supabase
          .from("user_packages")
          .select("package_id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const packageId = (activePkg as any)?.package_id as string | undefined;
        if (!packageId) {
          if (!cancelled) setEnabledByKey(null);
          return;
        }

        const { data: rules, error } = await supabase
          .from("package_menu_rules")
          .select("menu_key,is_enabled")
          .eq("package_id", packageId);
        if (error) throw error;

        // Default: enabled unless explicitly disabled
        const next: Record<MenuKey, boolean> = {
          ai_agents: true,
          messages: true,
          content_planner: true,
          reporting: true,
        };

        let foundAny = false;
        (rules as RuleRow[] | null)?.forEach((r) => {
          const k = String(r.menu_key) as MenuKey;
          if (CONTROLLED_KEYS.includes(k)) {
            next[k] = Boolean(r.is_enabled);
            foundAny = true;
          }
        });

        // If no rules exist for that package, don't gate anything.
        if (!cancelled) setEnabledByKey(foundAny ? next : null);
      } catch {
        if (!cancelled) setEnabledByKey(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isEnabled = useMemo(() => {
    return (key: MenuKey) => enabledByKey?.[key] ?? true;
  }, [enabledByKey]);

  return { loading, enabledByKey, isEnabled };
}
