import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, MessageCircle, Mail, Phone, Pencil, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { ContactItemCard } from "./website-contact/ContactItemCard";
import { defaultItems, sanitizeItems, type ContactItem, type ContactItemKey } from "./website-contact/types";

const SETTINGS_KEY = "contact_other_ways";

export default function WebsiteContact() {
  const { toast } = useToast();
  const [items, setItems] = useState<ContactItem[]>(defaultItems);
  const [baselineItems, setBaselineItems] = useState<ContactItem[]>(defaultItems);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const iconByKey = useMemo(
    () => ({
      email: Mail,
      phone: Phone,
      whatsapp: MessageCircle,
      location: MapPin,
    }),
    []
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("website_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        console.error("Failed to load website contact settings", error);
        setItems(defaultItems);
        setBaselineItems(defaultItems);
      } else {
        const next = sanitizeItems(data?.value);
        setItems(next);
        setBaselineItems(next);
      }
      setLoading(false);
    })();
  }, []);

  const updateItem = (key: ContactItemKey, patch: Partial<Omit<ContactItem, "key">>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  // Autosave (debounced) while editing
  useEffect(() => {
    if (!isEditing || loading) return;

    const timer = window.setTimeout(async () => {
      setSaving(true);
      const payload = { key: SETTINGS_KEY, value: items };

      const { error } = await (supabase as any)
        .from("website_settings")
        .upsert(payload, { onConflict: "key" });

      if (error) {
        toast({ variant: "destructive", title: "Gagal menyimpan", description: error.message });
      } else {
        setLastSavedAt(new Date());
      }
      setSaving(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [items, isEditing, loading, toast]);

  const cancelEdit = () => {
    setItems(baselineItems);
    setIsEditing(false);
  };

  const finishEdit = () => {
    setBaselineItems(items);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Page</h1>
          <p className="text-muted-foreground">Ubah bagian “Other Ways to Reach Us” di halaman /contact.</p>
          <div className="mt-2 text-xs text-muted-foreground">
            {loading ? (
              "Loading..."
            ) : saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
              </span>
            ) : lastSavedAt ? (
              <>Tersimpan {lastSavedAt.toLocaleTimeString()} (auto-save)</>
            ) : (
              "Auto-save aktif saat mode Edit."
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={finishEdit} disabled={saving}>
                Selesai
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} disabled={loading}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Reach Us</CardTitle>
          <CardDescription>Isi ini tampil sebagai 4 kartu di halaman publik Contact.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => {
                const Icon = iconByKey[item.key];
                return (
                  <ContactItemCard
                    key={item.key}
                    item={item}
                    icon={Icon}
                    disabled={!isEditing || saving}
                    onChange={updateItem}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
