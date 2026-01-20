import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live unread messages count for the current user.
 * Treats NULL as unread (legacy rows).
 */
export function useUnreadMessagesCount(userId: string | null | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  const enabled = useMemo(() => Boolean(userId), [userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const refresh = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .or("is_read.is.null,is_read.eq.false");

      if (!isMounted) return;
      setUnreadCount(count || 0);
    };

    refresh();

    const channel = supabase
      .channel(`unread-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row?.is_read) return;
          refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  return { unreadCount };
}
