import { useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ContactMessageForm } from "@/components/contact/ContactMessageForm";

function getDisplayName(user: any): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const fromMeta = String(meta?.name ?? "").trim();
  const first = String(meta?.first_name ?? "").trim();
  const last = String(meta?.last_name ?? "").trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return fromMeta || combined || String(user?.email ?? "").split("@")[0] || "";
}

export default function UserSupport() {
  const { user } = useAuth();

  const name = useMemo(() => getDisplayName(user), [user]);
  const email = useMemo(() => String(user?.email ?? ""), [user]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Support</h1>
        <p className="text-sm text-muted-foreground">Send a message to the team. We'll get back to you by email.</p>
      </header>

      <ContactMessageForm
        wrapper="card"
        source="business_support"
        defaultValues={{ name, email }}
        disableNameEmail
      />
    </div>
  );
}
