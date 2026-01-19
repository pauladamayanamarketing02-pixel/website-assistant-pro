import { useMemo, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Minimal 8 karakter").max(128, "Maksimal 128 karakter"),
    confirmPassword: z.string().min(1, "Wajib diisi"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

const emailSchema = z.object({
  newEmail: z.string().trim().email("Email tidak valid").max(255, "Maksimal 255 karakter"),
});

async function trySendSecurityEmail(payload: unknown) {
  // Best effort: kalau belum dikonfigurasi, UI tetap jalan.
  const { error } = await supabase.functions.invoke("admin-security-notify", {
    body: payload,
  });
  return { error };
}

export default function AdminAccount() {
  const { user } = useAuth();
  const { toast } = useToast();

  const currentEmail = user?.email ?? "";

  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const passwordErrors = useMemo(() => {
    const parsed = passwordSchema.safeParse(passwordForm);
    if (parsed.success) return {} as Record<string, string>;

    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "form");
      map[key] = issue.message;
    }
    return map;
  }, [passwordForm]);

  const emailErrors = useMemo(() => {
    const parsed = emailSchema.safeParse({ newEmail });
    if (parsed.success) return {} as Record<string, string>;

    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "form");
      map[key] = issue.message;
    }
    return map;
  }, [newEmail]);

  const handleChangePassword = async () => {
    const parsed = passwordSchema.safeParse(passwordForm);
    if (!parsed.success) {
      toast({ variant: "destructive", title: "Validasi gagal", description: "Periksa input password." });
      return;
    }

    if (!currentEmail) {
      toast({ variant: "destructive", title: "Error", description: "Email admin tidak ditemukan." });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
      if (error) throw error;

      // Notifikasi ke email admin saat ini (best effort)
      const { error: notifyErr } = await trySendSecurityEmail({
        type: "password_changed",
        to: currentEmail,
        newPassword: parsed.data.newPassword,
      });

      setPasswordForm({ newPassword: "", confirmPassword: "" });

      toast({
        title: "Password berhasil diubah",
        description: notifyErr
          ? "Password berubah, namun notifikasi email belum aktif (butuh konfigurasi Resend)."
          : "Password berubah dan notifikasi email telah dikirim.",
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal mengubah password", description: e?.message ?? "Unknown error" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    const parsed = emailSchema.safeParse({ newEmail });
    if (!parsed.success) {
      toast({ variant: "destructive", title: "Validasi gagal", description: "Email baru tidak valid." });
      return;
    }

    if (!currentEmail) {
      toast({ variant: "destructive", title: "Error", description: "Email admin saat ini tidak ditemukan." });
      return;
    }

    if (parsed.data.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast({ variant: "destructive", title: "Tidak ada perubahan", description: "Email baru sama dengan email lama." });
      return;
    }

    setChangingEmail(true);
    try {
      // Supabase akan mengirim email konfirmasi ke alamat baru (sesuai setting auth).
      const { error } = await supabase.auth.updateUser({ email: parsed.data.newEmail });
      if (error) throw error;

      // Notifikasi ke email lama (best effort)
      const { error: notifyErr } = await trySendSecurityEmail({
        type: "email_change_requested",
        to: currentEmail,
        oldEmail: currentEmail,
        newEmail: parsed.data.newEmail,
      });

      toast({
        title: "Permintaan ganti email dibuat",
        description: notifyErr
          ? "Cek email baru untuk konfirmasi. Notifikasi ke email lama belum aktif (butuh konfigurasi Resend)."
          : "Cek email baru untuk konfirmasi. Notifikasi juga telah dikirim ke email lama.",
      });

      setNewEmail("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal mengganti email", description: e?.message ?? "Unknown error" });
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground">Kelola akun admin (email & password).</p>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Catatan</AlertTitle>
        <AlertDescription>
          Fitur notifikasi email via Resend akan aktif setelah kunci Resend dikonfigurasi. Halaman ini tetap bisa
          dipakai untuk update email/password.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email</CardTitle>
              <CardDescription>Ganti email dengan konfirmasi Supabase + notifikasi ke email lama.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current email</Label>
            <Input value={currentEmail} disabled className="bg-muted" />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="newEmail">New email</Label>
            <Input
              id="newEmail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nama@domain.com"
              autoComplete="email"
            />
            {emailErrors.newEmail && <p className="text-sm text-destructive">{emailErrors.newEmail}</p>}
            <p className="text-xs text-muted-foreground">Setelah submit, cek email baru untuk link konfirmasi.</p>
          </div>

          <Button onClick={handleChangeEmail} disabled={changingEmail || !newEmail || !!emailErrors.newEmail}>
            {changingEmail ? "Memproses..." : "Request Email Change"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>Ubah password + notifikasi ke email admin saat ini.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword((v) => !v)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>}
            <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>}
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || !!passwordErrors.newPassword || !!passwordErrors.confirmPassword}
          >
            {changingPassword ? "Mengubah..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
