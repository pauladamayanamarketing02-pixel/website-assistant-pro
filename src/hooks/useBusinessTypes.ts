import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type BusinessTypeRow = {
  id: string;
  category: string;
  type: string;
  is_active: boolean;
  sort_order: number;
};

export type BusinessTypeCategory = {
  category: string;
  types: string[];
};

type Options = {
  /** When true, returns empty list if DB has no rows (no fallback). */
  noFallback?: boolean;
  fallback?: BusinessTypeCategory[];
};

export function useBusinessTypes(options?: Options) {
  const [rows, setRows] = useState<BusinessTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOthers = (value: unknown) => String(value ?? "").trim().toLowerCase() === "others";
  const compareWithOthersLast = (a: unknown, b: unknown) => {
    const ao = isOthers(a);
    const bo = isOthers(b);
    if (ao && !bo) return 1;
    if (!ao && bo) return -1;
    return String(a ?? "").localeCompare(String(b ?? ""));
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await (supabase as any)
          .from("business_types")
          .select("id, category, type, is_active, sort_order")
          .eq("is_active", true)
          .order("category", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("type", { ascending: true });

        if (error) throw error;
        if (!cancelled) setRows((data ?? []) as BusinessTypeRow[]);
      } catch (e: any) {
        if (!cancelled) {
          setRows([]);
          setError(e?.message ? String(e.message) : "Failed to load business types");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories: BusinessTypeCategory[] = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const cat = String(r.category ?? "").trim();
      const type = String(r.type ?? "").trim();
      if (!cat || !type) continue;
      const arr = map.get(cat) ?? [];
      arr.push(type);
      map.set(cat, arr);
    }

    const result = Array.from(map.entries())
      .map(([category, types]) => {
        const uniqueTypes = Array.from(new Set(types));
        uniqueTypes.sort(compareWithOthersLast);
        return {
          category,
          types: uniqueTypes,
        };
      })
      .sort((a, b) => compareWithOthersLast(a.category, b.category));

    if (result.length === 0 && !options?.noFallback) {
      return options?.fallback ?? [];
    }

    return result;
  }, [options?.fallback, options?.noFallback, rows]);

  return { categories, loading, error, rows };
}
