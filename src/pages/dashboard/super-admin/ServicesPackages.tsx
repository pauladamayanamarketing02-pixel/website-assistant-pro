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

export default function ServicesPackages() {
  const [editUnlocked, setEditUnlocked] = useState(false);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Services / Packages</h1>
        <p className="text-muted-foreground">Kelola paket & layanan (kritis): harga, durasi, fitur, aktif/nonaktif.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Menu ini KRITIS. Sebelum edit paket, wajib konfirmasi ekstra (OTP/2FA) — untuk sekarang berupa “unlock” placeholder.
          </p>

          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant={editUnlocked ? "secondary" : "default"}>
                  {editUnlocked ? "Edit Unlocked" : "Unlock Edit (Placeholder)"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Akses Sensitif</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ini placeholder untuk OTP/2FA. Lanjutkan untuk membuka mode edit paket.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setEditUnlocked(true)}>Saya Mengerti</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={() => setEditUnlocked(false)} disabled={!editUnlocked}>
              Lock
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">{editUnlocked ? "Unlocked" : "Locked"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paket Digital Marketing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Placeholder: CRUD paket (nama, harga, durasi, fitur), toggle aktif/nonaktif.
        </CardContent>
      </Card>
    </div>
  );
}
