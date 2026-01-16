import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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

export default function Emergency() {
  const [maintenance, setMaintenance] = useState(false);
  const [lockAdmins, setLockAdmins] = useState(false);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Emergency Tools</h1>
        <p className="text-muted-foreground">Disable payment, lock login admin, force logout semua session, maintenance mode cepat.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mode Darurat (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Maintenance Mode</div>
              <div className="text-xs text-muted-foreground">Akan menonaktifkan akses user (placeholder UI).</div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <Switch checked={maintenance} onCheckedChange={() => {}} />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi: Maintenance Mode</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ini aksi darurat. Untuk sekarang hanya mengubah state UI (belum mempengaruhi sistem).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setMaintenance((v) => !v)}>Konfirmasi</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Lock Semua Login Admin</div>
              <div className="text-xs text-muted-foreground">Mencegah admin login sementara (placeholder).</div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <Switch checked={lockAdmins} onCheckedChange={() => {}} />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi: Lock Admin Login</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ini aksi darurat. Untuk sekarang hanya mengubah state UI (belum mempengaruhi sistem).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setLockAdmins((v) => !v)}>Konfirmasi</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="destructive">Force Logout Semua Session (Placeholder)</Button>
            <Button variant="outline">Disable Payment Sementara (Placeholder)</Button>
          </div>

          <p className="text-xs text-muted-foreground">Menu ini hanya untuk Super Admin; semua aksi wajib tercatat di Audit Log.</p>
        </CardContent>
      </Card>
    </div>
  );
}
