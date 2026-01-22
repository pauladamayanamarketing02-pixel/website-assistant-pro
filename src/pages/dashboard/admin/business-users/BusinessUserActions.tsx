import { useMemo, useState } from "react";
import { CreditCard, Eye, KeyRound, Mail, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  paymentActive: boolean;
  onView: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
};

export function BusinessUserActions({ userId, email, paymentActive, onView, onDeleted, onUpdated }: Props) {
  const { toast } = useToast();
  const [sendingReset, setSendingReset] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sendingEmailChange, setSendingEmailChange] = useState(false);
  const [currentAuthEmail, setCurrentAuthEmail] = useState<string | null>(null);
  const [pendingAuthEmail, setPendingAuthEmail] = useState<string | null>(null);
  const [loadingAuthEmail, setLoadingAuthEmail] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const canTrigger = useMemo(() => Boolean(userId) && Boolean(email && email !== "—"), [email, userId]);

  const nextPaymentActive = !paymentActive;

  const onConfirmTogglePayment = async () => {
    if (!userId) return;
    setUpdatingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-payment-active", {
        body: { user_id: userId, payment_active: nextPaymentActive },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));

      toast({
        title: `Payment Active: ${nextPaymentActive ? "YES" : "NO"}`,
        description: nextPaymentActive
          ? "User now has full access to the dashboard."
          : "User access is now limited to My Package.",
      });

      setPaymentDialogOpen(false);
      onUpdated?.();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e?.message ?? "Could not update payment status.",
      });
    } finally {
      setUpdatingPayment(false);
    }
  };

  const openEmailDialog = async () => {
    setEmailOpen(true);

    if (!userId) return;
    setLoadingAuthEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-account-actions", {
        body: { action: "get_user_email", user_id: userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));

      setCurrentAuthEmail((data as any)?.email ?? null);
      setPendingAuthEmail((data as any)?.pending_email ?? null);
    } catch {
      // Fallback to the email we already have from app tables.
      setCurrentAuthEmail(null);
      setPendingAuthEmail(null);
    } finally {
      setLoadingAuthEmail(false);
    }
  };

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
        title: "Password reset sent",
        description: `A password reset link has been sent to ${email}.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e?.message ?? "Could not send password reset email.",
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
        title: "Email change requested",
        description: `A confirmation email was sent to ${next}.`,
      });
      setEmailOpen(false);
      setNewEmail("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e?.message ?? "Could not send email change confirmation.",
      });
    } finally {
      setSendingEmailChange(false);
    }
  };

  const onDeleteUser = async () => {
    if (!userId) return;
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-account-actions", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));

      toast({
        title: "Account deleted",
        description: "Auth user and all related data have been deleted.",
      });
      setDeleteOpen(false);
      setDeleteConfirm("");
      onDeleted?.();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e?.message ?? "Could not delete account.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={paymentActive ? "Payment Active" : "Payment Nonactive"}
          onClick={() => setPaymentDialogOpen(true)}
          disabled={!userId || updatingPayment}
        >
          <CreditCard className={"h-4 w-4 " + (paymentActive ? "text-success" : "text-destructive")} />
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
          onClick={openEmailDialog}
          disabled={!canTrigger || sendingReset || sendingEmailChange}
        >
          <Mail className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Delete"
          onClick={() => setDeleteOpen(true)}
          disabled={!userId || sendingReset || sendingEmailChange || deleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>

        <Button variant="outline" size="icon" className="h-8 w-8" title="View" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>Enter the new email. Supabase will send a confirmation email before the account email changes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`new-email-${userId}`}>New email</Label>
            <Input
              id={`new-email-${userId}`}
              type="email"
              placeholder="nama@domain.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={sendingEmailChange}
            />
            <p className="text-xs text-muted-foreground">
              Current email: {loadingAuthEmail ? "Loading..." : currentAuthEmail ?? email}
              {pendingAuthEmail ? (
                <span className="block">Pending new email: {pendingAuthEmail}</span>
              ) : null}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={sendingEmailChange}>
              Cancel
            </Button>
            <Button onClick={onSubmitChangeEmail} disabled={sendingEmailChange || !newEmail.trim()}>
              {sendingEmailChange ? "Sending..." : "Send confirmation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Payment Active?</AlertDialogTitle>
            <AlertDialogDescription>
              Set Payment Active to <span className="font-medium">{nextPaymentActive ? "YES" : "NO"}</span> for this user.
              {" "}
              {nextPaymentActive
                ? "YES gives full access to all /dashboard/user menus."
                : "NO limits access to My Package only."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onConfirmTogglePayment();
              }}
              disabled={updatingPayment}
            >
              {updatingPayment ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the user in Supabase Authentication and all related data (profiles, businesses, roles, and activity).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`delete-confirm-${userId}`}>Type DELETE to confirm</Label>
            <Input
              id={`delete-confirm-${userId}`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              disabled={deleting}
            />
            <p className="text-xs text-muted-foreground">Target: {currentAuthEmail ?? email}</p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep dialog open while we run deletion.
                e.preventDefault();
                if (deleteConfirm.trim().toUpperCase() !== "DELETE") return;
                void onDeleteUser();
              }}
              disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
            >
              <span className="sr-only">Confirm delete</span>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
