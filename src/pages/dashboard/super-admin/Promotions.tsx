import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Promotions() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Promotions</h1>
        <p className="text-muted-foreground">Kode promo, diskon global, voucher khusus, limit & masa berlaku.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konfirmasi Ekstra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Perubahan promo berdampak ke revenue. Placeholder untuk konfirmasi ekstra.</p>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>{unlocked ? "Unlocked" : "Unlock (Placeholder)"}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Perubahan Promo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ini placeholder untuk OTP/2FA. Lanjutkan untuk membuka fitur edit promo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setUnlocked(true)}>Lanjut</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={() => setUnlocked(false)} disabled={!unlocked}>
              Lock
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Promo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Placeholder: CRUD promo/voucher + aturan limit & expiry.</CardContent>
      </Card>
    </div>
  );
}
