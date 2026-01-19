import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Building2, FileText, Image as ImageIcon, Megaphone, Package, Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DetailTab = "business" | "marketing" | "knowledge" | "gallery" | "reports" | "packages" | "config";

type BusinessRow = {
  id: string;
  user_id: string;
  business_name: string | null;
  business_number: number | null;
  business_type: string | null;
  business_address: string | null;
  city: string | null;
  country: string | null;
  website_url: string | null;
  gmb_link: string | null;
  primary_service: string | null;
  secondary_services: any;
  service_short_description: string | null;
  service_area: string | null;
  marketing_goal_type: string | null;
  marketing_goal_text: string | null;
  bkb_content: string | null;
  brand_expert_content: string | null;
  persona1_title: string | null;
  persona1_content: string | null;
  persona2_title: string | null;
  persona2_content: string | null;
  persona3_title: string | null;
  persona3_content: string | null;
};

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string | null;
};

type GalleryItem = {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  created_at: string;
};

type UserPackage = {
  id: string;
  status: string | null;
  started_at: string;
  expires_at: string | null;
  package: {
    name: string;
    type: string;
    price: number | null;
  } | null;
};

export default function AdminBusinessUserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState<DetailTab>("business");
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [packages, setPackages] = useState<UserPackage[]>([]);

  const businessIdLabel = useMemo(() => {
    const n = business?.business_number;
    return n ? `B${String(n).padStart(5, "0")}` : "—";
  }, [business?.business_number]);

  useEffect(() => {
    if (!userId) return;
    void fetchAll(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchAll = async (uid: string) => {
    try {
      setLoading(true);

      const [profileRes, businessRes, galleryRes, packagesRes] = await Promise.all([
        (supabase as any).from("profiles").select("id, name, email, phone, status").eq("id", uid).maybeSingle(),
        (supabase as any).from("businesses").select("*").eq("user_id", uid).maybeSingle(),
        (supabase as any)
          .from("user_gallery")
          .select("id, name, type, url, size, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        (supabase as any)
          .from("user_packages")
          .select("id, status, started_at, expires_at, package:packages(name, type, price)")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (businessRes.error) throw businessRes.error;
      if (galleryRes.error) throw galleryRes.error;
      if (packagesRes.error) throw packagesRes.error;

      setProfile((profileRes.data as any) ?? null);
      setBusiness((businessRes.data as any) ?? null);
      setGallery(((galleryRes.data as any[]) ?? []) as GalleryItem[]);
      setPackages(((packagesRes.data as any[]) ?? []) as UserPackage[]);
    } catch (e) {
      console.error("Error loading business user details:", e);
      setProfile(null);
      setBusiness(null);
      setGallery([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = business?.business_name || profile?.name || "Business Details";
  const headerSubtitle = profile?.email || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/admin/business-users")}> 
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{headerTitle}</h1>
          <p className="text-sm text-muted-foreground truncate">{headerSubtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">{businessIdLabel}</Badge>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading details...</div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Details
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Marketing Setup
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Data utama bisnis dan kontak.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Business Name</div>
                  <div className="text-sm font-medium text-foreground">{business?.business_name || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Contact Name</div>
                  <div className="text-sm font-medium text-foreground">{profile?.name || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm text-foreground">{profile?.email || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm text-foreground">{profile?.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Country / City</div>
                  <div className="text-sm text-foreground">
                    {business?.country || "—"}{business?.city ? ` / ${business.city}` : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="text-sm text-foreground">{business?.business_address || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Website</div>
                  <div className="text-sm text-foreground">{business?.website_url || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">GMB Link</div>
                  <div className="text-sm text-foreground">{business?.gmb_link || "—"}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Setup</CardTitle>
                <CardDescription>Ringkasan setup marketing dari database.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Primary Service</div>
                  <div className="text-sm text-foreground">{business?.primary_service || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Service Area</div>
                  <div className="text-sm text-foreground">{business?.service_area || "—"}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Secondary Services</div>
                  <div className="text-sm text-foreground">
                    {Array.isArray(business?.secondary_services)
                      ? (business?.secondary_services as any[]).filter(Boolean).join(", ") || "—"
                      : "—"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Short Description</div>
                  <div className="text-sm text-foreground">{business?.service_short_description || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Marketing Goal Type</div>
                  <div className="text-sm text-foreground">{business?.marketing_goal_type || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Marketing Goal Text</div>
                  <div className="text-sm text-foreground">{business?.marketing_goal_text || "—"}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge</CardTitle>
                <CardDescription>Business Knowledge Base dan persona.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">BKB</div>
                  <div className="text-sm whitespace-pre-wrap text-foreground">{business?.bkb_content || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Brand Expert</div>
                  <div className="text-sm whitespace-pre-wrap text-foreground">{business?.brand_expert_content || "—"}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{business?.persona1_title || "Persona 1"}</div>
                    <div className="text-sm whitespace-pre-wrap text-foreground">{business?.persona1_content || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{business?.persona2_title || "Persona 2"}</div>
                    <div className="text-sm whitespace-pre-wrap text-foreground">{business?.persona2_content || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{business?.persona3_title || "Persona 3"}</div>
                    <div className="text-sm whitespace-pre-wrap text-foreground">{business?.persona3_content || "—"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
                <CardDescription>File yang tersimpan di user_gallery.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gallery.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No gallery items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      gallery.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell className="text-muted-foreground">{g.type}</TableCell>
                          <TableCell className="text-muted-foreground">{g.size ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{String(g.created_at).slice(0, 10)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Ringkasan laporan (akan ditambahkan).</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Packages</CardTitle>
                <CardDescription>Riwayat paket dari user_packages.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No packages.
                        </TableCell>
                      </TableRow>
                    ) : (
                      packages.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.package?.name || p.package?.type || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{p.status || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{String(p.started_at).slice(0, 10)}</TableCell>
                          <TableCell className="text-muted-foreground">{p.expires_at ? String(p.expires_at).slice(0, 10) : "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Config</CardTitle>
                <CardDescription>Info akun (admin view).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span> <span className="text-foreground">{userId || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Profile Status:</span> <span className="text-foreground">{profile?.status || "—"}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
