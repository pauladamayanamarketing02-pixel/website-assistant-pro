import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type RuleRow = {
  tool_id: string;
  is_enabled: boolean;
};

/**
 * Controls AI tool visibility (assist_ai_tools) per package.
 * Default behavior: tools are enabled unless explicitly disabled.
 */
export function usePackageAiToolRules(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [enabledByToolId, setEnabledByToolId] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const { data: activePkg } = await (supabase as any)
          .from("user_packages")
          .select("package_id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const packageId = (activePkg as any)?.package_id as string | undefined;
        if (!packageId) {
          if (!cancelled) setEnabledByToolId(null);
          return;
        }

        const { data: rules, error } = await (supabase as any)
          .from("package_ai_tool_rules")
          .select("tool_id,is_enabled")
          .eq("package_id", packageId);

        if (error) throw error;

        const next: Record<string, boolean> = {};
        let foundAny = false;
        (rules as unknown as RuleRow[] | null)?.forEach((r) => {
          const id = String(r.tool_id);
          next[id] = Boolean(r.is_enabled);
          foundAny = true;
        });

        // If no rules exist for that package, don't gate anything.
        if (!cancelled) setEnabledByToolId(foundAny ? next : null);
      } catch {
        if (!cancelled) setEnabledByToolId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isToolEnabled = useMemo(() => {
    return (toolId: string) => enabledByToolId?.[toolId] ?? true;
  }, [enabledByToolId]);

  return { loading, enabledByToolId, isToolEnabled };
}
