import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ImportType =
  | "Social Media Posts"
  | "Content Media Posts"
  | "GMB Posts"
  | "Email Marketing"
  | "Ads Marketing";

type SortDirection = "asc" | "desc";

type BusinessOption = {
  id: string;
  name: string;
};

type ContentRow = {
  id: string;
  businessId: string;
  businessName: string;
  category: string;
  socialMediaPosts: number;
  contentMediaPosts: number;
  gmbPosts: number;
  emailMarketing: number;
  adsMarketing: number;
};

const IMPORT_TYPES: ImportType[] = [
  "Social Media Posts",
  "Content Media Posts",
  "GMB Posts",
  "Email Marketing",
  "Ads Marketing",
];

const FALLBACK_ROWS: ContentRow[] = [
  {
    id: "demo-1",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Promo",
    socialMediaPosts: 12,
    contentMediaPosts: 6,
    gmbPosts: 4,
    emailMarketing: 3,
    adsMarketing: 2,
  },
  {
    id: "demo-2",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Edukasi",
    socialMediaPosts: 18,
    contentMediaPosts: 10,
    gmbPosts: 5,
    emailMarketing: 6,
    adsMarketing: 1,
  },
  {
    id: "demo-3",
    businessId: "demo",
    businessName: "Demo Business",
    category: "Testimoni",
    socialMediaPosts: 7,
    contentMediaPosts: 3,
    gmbPosts: 2,
    emailMarketing: 1,
    adsMarketing: 0,
  },
];

function safeName(name: string | null | undefined) {
  return (name ?? "(Tanpa Nama)").trim() || "(Tanpa Nama)";
}

export default function ContentCreation() {
  const { toast } = useToast();

  const [lastImportType, setLastImportType] = React.useState<ImportType | null>(null);
  const [businesses, setBusinesses] = React.useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string>("all");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState<ContentRow | null>(null);

  const [detailsForm, setDetailsForm] = React.useState({
    title: "",
    description: "",
    comments: "",
    dateSuggest: "",
    category: "",
  });

  React.useEffect(() => {
    let cancelled = false;

    const loadBusinesses = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name")
        .order("business_name", { ascending: true, nullsFirst: false });

      if (cancelled) return;

      if (error) {
        // Jangan blok UI — fallback ke data demo
        setBusinesses([]);
        return;
      }

      const list: BusinessOption[] = (data ?? []).map((b) => ({
        id: b.id,
        name: safeName(b.business_name),
      }));

      setBusinesses(list);
    };

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows: ContentRow[] = React.useMemo(() => {
    // Placeholder sampai data real dibuat: buat 1 baris per bisnis
    if (businesses.length > 0) {
      return businesses.map((b) => ({
        id: `${b.id}-general`,
        businessId: b.id,
        businessName: b.name,
        category: "General",
        socialMediaPosts: 0,
        contentMediaPosts: 0,
        gmbPosts: 0,
        emailMarketing: 0,
        adsMarketing: 0,
      }));
    }

    return FALLBACK_ROWS;
  }, [businesses]);

  const displayedRows = React.useMemo(() => {
    const filtered =
      selectedBusinessId === "all" ? rows : rows.filter((r) => r.businessId === selectedBusinessId);

    const dir = sortDirection === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) =>
      a.businessName.localeCompare(b.businessName, "id", { sensitivity: "base" }) * dir,
    );
  }, [rows, selectedBusinessId, sortDirection]);

  const onImport = (type: ImportType) => {
    setLastImportType(type);
    toast({
      title: "Import dipilih",
      description: `Anda memilih import: ${type}`,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Content Creation</h1>
          <p className="text-muted-foreground">Kelola ide, kategori, dan konten untuk klien.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button">Upload</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary">
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 w-64">
              {IMPORT_TYPES.map((t) => (
                <DropdownMenuItem key={t} onClick={() => onImport(t)}>
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Manajemen Content</CardTitle>
            {lastImportType ? (
              <p className="text-sm text-muted-foreground">Terakhir dipilih: {lastImportType}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Sortir berdasarkan nama bisnis" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">Semua Bisnis</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
            >
              Sort Nama: {sortDirection === "asc" ? "A–Z" : "Z–A"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Social Media Posts</TableHead>
                <TableHead className="text-right">Content Media Posts</TableHead>
                <TableHead className="text-right">GMB Posts</TableHead>
                <TableHead className="text-right">Email Marketing</TableHead>
                <TableHead className="text-right">Ads Marketing</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {displayedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.businessName}</TableCell>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell className="text-right">{row.socialMediaPosts}</TableCell>
                  <TableCell className="text-right">{row.contentMediaPosts}</TableCell>
                  <TableCell className="text-right">{row.gmbPosts}</TableCell>
                  <TableCell className="text-right">{row.emailMarketing}</TableCell>
                  <TableCell className="text-right">{row.adsMarketing}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveRow(row);
                        setDetailsForm({
                          title: "",
                          description: "",
                          comments: "",
                          dateSuggest: new Date().toISOString().slice(0, 10),
                          category: row.category,
                        });
                        setDetailsOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Tidak ada data untuk bisnis yang dipilih.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>View Details</DialogTitle>
            <DialogDescription>
              {activeRow ? `${activeRow.businessName} • ${activeRow.category}` : "Detail konten"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Images */}
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Images</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="overflow-hidden rounded-md border">
                    <img
                      src="/placeholder.svg"
                      alt="Preview image 1"
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <img
                      src="/placeholder.svg"
                      alt="Preview image 2"
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <img
                      src="/placeholder.svg"
                      alt="Preview image 3"
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <img
                      src="/placeholder.svg"
                      alt="Preview image 4"
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                </div>
              </section>

              {/* Details + Manage */}
              <section className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Details</h2>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={detailsForm.title}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Judul konten..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={detailsForm.description}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Deskripsi..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comments</Label>
                    <Textarea
                      value={detailsForm.comments}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, comments: e.target.value }))}
                      placeholder="Catatan / komentar..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Manage</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date Suggest</Label>
                      <Input
                        type="date"
                        value={detailsForm.dateSuggest}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, dateSuggest: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={detailsForm.category}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, category: e.target.value }))}
                        placeholder="Kategori..."
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                toast({
                  title: "Tersimpan",
                  description: "Perubahan disimpan (sementara masih placeholder).",
                });
                setDetailsOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
