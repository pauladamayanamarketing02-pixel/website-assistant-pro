import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, MessageCircle, Phone, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = "contact_other_ways";

type ContactItemKey = "email" | "phone" | "whatsapp" | "location";

type ContactItem = {
  key: ContactItemKey;
  title: string;
  detail: string;
  description: string;
};

const defaultItems: ContactItem[] = [
  {
    key: "email",
    title: "Email Us",
    detail: "hello@easymarketingassist.com",
    description: "We typically respond within 24 hours",
  },
  {
    key: "phone",
    title: "Call Us",
    detail: "+1 (555) 123-4567",
    description: "Mon-Fri from 9am to 5pm EST",
  },
  {
    key: "whatsapp",
    title: "WhatsApp",
    detail: "+1 (555) 123-4567",
    description: "Quick responses for existing clients",
  },
  {
    key: "location",
    title: "Location",
    detail: "Remote / Worldwide",
    description: "Available for global clients",
  },
];

function sanitizeItems(value: unknown): ContactItem[] {
  if (!Array.isArray(value)) return defaultItems;

  const byKey = new Map<ContactItemKey, ContactItem>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as any;
    if (!["email", "phone", "whatsapp", "location"].includes(obj.key)) continue;

    const item: ContactItem = {
      key: obj.key,
      title: typeof obj.title === "string" ? obj.title : "",
      detail: typeof obj.detail === "string" ? obj.detail : "",
      description: typeof obj.description === "string" ? obj.description : "",
    };
    byKey.set(item.key, item);
  }

  // Keep order stable
  return defaultItems.map((d) => byKey.get(d.key) ?? d);
}

export default function WebsiteContact() {
  const { toast } = useToast();
  const [items, setItems] = useState<ContactItem[]>(defaultItems);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        // Don't block the page; just fallback
        console.error("Failed to load website contact settings", error);
        setItems(defaultItems);
      } else {
        setItems(sanitizeItems(data?.value));
      }
      setLoading(false);
    })();
  }, []);

  const updateItem = (key: ContactItemKey, patch: Partial<Omit<ContactItem, "key">>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { key: SETTINGS_KEY, value: items };

    const { error } = await (supabase as any)
      .from("website_settings")
      .upsert(payload, { onConflict: "key" });

    if (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: error.message });
    } else {
      toast({ title: "Tersimpan", description: "Contact info berhasil diupdate." });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Page</h1>
          <p className="text-muted-foreground">Ubah bagian “Other Ways to Reach Us” di halaman /contact.</p>
        </div>

        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save"}
        </Button>
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
                  <Card key={item.key} className="shadow-soft">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.key.toUpperCase()}</CardTitle>
                          <CardDescription>Ubah teks yang ditampilkan.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${item.key}-title`}>Title</Label>
                        <Input
                          id={`${item.key}-title`}
                          value={item.title}
                          onChange={(e) => updateItem(item.key, { title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${item.key}-detail`}>Detail</Label>
                        <Input
                          id={`${item.key}-detail`}
                          value={item.detail}
                          onChange={(e) => updateItem(item.key, { detail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${item.key}-desc`}>Description</Label>
                        <Input
                          id={`${item.key}-desc`}
                          value={item.description}
                          onChange={(e) => updateItem(item.key, { description: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
