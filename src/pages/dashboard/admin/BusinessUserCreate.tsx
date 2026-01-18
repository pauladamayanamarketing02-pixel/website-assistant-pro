import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCreateBusinessUser() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    phone: "",
  });

  const onSubmit = async () => {
    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      toast({ variant: "destructive", title: "Email wajib diisi" });
      return;
    }
    if (!password || password.length < 8) {
      toast({ variant: "destructive", title: "Password minimal 8 karakter" });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email,
          password,
          fullName: form.fullName.trim(),
          businessName: form.businessName.trim(),
          phone: form.phone.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Berhasil dibuat",
        description: `Akun user sudah dibuat dan bisa langsung login: ${email}`,
      });

      // kembali ke list
      navigate("/dashboard/admin/business-users", { replace: true });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal membuat akun",
        description: e?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Add New Business</h1>
          <p className="text-sm text-muted-foreground">Buat akun login role user (tanpa email konfirmasi).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Button type="button" onClick={onSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account & Business Info</CardTitle>
          <CardDescription>
            Minimal: email + password. Opsional: nama, business name, phone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="user@company.com"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password*</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nama lengkap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
              placeholder="Nama bisnis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+62..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
