import { useMemo, useState } from "react";
import { CheckCircle2, Eye, KeyRound, Mail, Trash2, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userId: string;
  email: string;
  onView: () => void;
};

export function BusinessUserActions({ userId, email, onView }: Props) {
  const { toast } = useToast();
  const [sendingReset, setSendingReset] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sendingEmailChange, setSendingEmailChange] = useState(false);

  const canTrigger = useMemo(() => Boolean(userId) && Boolean(email && email !== "—"), [email, userId]);

  const onResetPassword = async () => {
    if (!email || email === "—") return;
    setSendingReset(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-account-actions", {
        body: { action: "reset_password", email },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));

      toast({
        title: "Reset password dikirim",
        description: `Link reset password sudah dikirim ke ${email}.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: e?.message ?? "Gagal mengirim reset password.",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const onSubmitChangeEmail = async () => {
    const next = newEmail.trim();
    if (!next) return;

    setSendingEmailChange(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-account-actions", {
        body: { action: "change_email", user_id: userId, new_email: next },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));

      toast({
        title: "Permintaan ganti email terkirim",
        description: `Konfirmasi email dikirim ke ${next}.`,
      });
      setEmailOpen(false);
      setNewEmail("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: e?.message ?? "Gagal mengirim konfirmasi email baru.",
      });
    } finally {
      setSendingEmailChange(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Set Active" disabled>
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Reset Password"
          onClick={onResetPassword}
          disabled={!canTrigger || sendingReset || sendingEmailChange}
        >
          <KeyRound className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Reset Email"
          onClick={() => setEmailOpen(true)}
          disabled={!canTrigger || sendingReset || sendingEmailChange}
        >
          <Mail className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" title="Set Nonactive" disabled>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" disabled>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>

        <Button variant="outline" size="icon" className="h-8 w-8" title="View" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Email</DialogTitle>
            <DialogDescription>
              Masukkan email baru. Supabase akan mengirim email konfirmasi ke alamat baru sebelum email akun berubah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`new-email-${userId}`}>Email baru</Label>
            <Input
              id={`new-email-${userId}`}
              type="email"
              placeholder="nama@domain.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={sendingEmailChange}
            />
            <p className="text-xs text-muted-foreground">Email sekarang: {email}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={sendingEmailChange}>
              Batal
            </Button>
            <Button onClick={onSubmitChangeEmail} disabled={sendingEmailChange || !newEmail.trim()}>
              {sendingEmailChange ? "Mengirim..." : "Kirim konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
