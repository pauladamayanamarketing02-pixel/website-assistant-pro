import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [checking, setChecking] = useState(true);

  const redirectTo = useMemo(() => `${window.location.origin}/dashboard/super-admin`, []);

  useEffect(() => {
    // Jika sudah login dan punya role super_admin → langsung masuk.
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) {
        setChecking(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Type assertion: role enum tidak selalu sinkron dengan types.ts
      if (roleData?.role === ("super_admin" as any)) {
        navigate("/dashboard/super-admin", { replace: true });
        return;
      }

      // Jika session ada tapi bukan super admin → logout supaya tidak nyangkut.
      await supabase.auth.signOut();
      setChecking(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;

      if (!data.user) throw new Error("Gagal login. Silakan coba lagi.");

      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleErr) throw roleErr;

      // Type assertion: role enum tidak selalu sinkron dengan types.ts
      if (roleData?.role !== ("super_admin" as any)) {
        await supabase.auth.signOut();
        throw new Error("Akun ini tidak memiliki akses Super Admin.");
      }

      toast({ title: "Berhasil login", description: "Mengalihkan ke Super Admin Dashboard..." });
      navigate("/dashboard/super-admin", { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Super Admin</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Login khusus untuk akses Super Admin.</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Login Super Admin</CardTitle>
            <CardDescription>Masukkan email &amp; password Super Admin.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))}
                  className={errors.email ? "border-destructive" : ""}
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData((s) => ({ ...s, password: e.target.value }))}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Memproses..." : "Login Super Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
