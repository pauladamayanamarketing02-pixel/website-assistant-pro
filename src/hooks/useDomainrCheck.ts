import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DomainrUiStatus = "available" | "unavailable" | "premium" | "unknown";

export type DomainrItem = {
  domain: string;
  status: DomainrUiStatus;
  price_usd: number | null;
  currency: string | null;
};

type State = {
  loading: boolean;
  error: string | null;
  items: DomainrItem[];
};

export function useDomainrCheck(query: string, { enabled = true, debounceMs = 450 } = {}) {
  const [state, setState] = useState<State>({ loading: false, error: null, items: [] });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const q = String(query ?? "").trim();
    if (!q) {
      setState({ loading: false, error: null, items: [] });
      return;
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { data, error } = await supabase.functions.invoke("domainr-check", {
          body: { query: q },
        });
        if (error) throw error;
        const items = ((data as any)?.items ?? []) as DomainrItem[];
        setState({ loading: false, error: null, items });
      } catch (e: any) {
        setState({ loading: false, error: e?.message ?? "Failed to check domain", items: [] });
      }
    }, debounceMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [debounceMs, enabled, query]);

  return state;
}
