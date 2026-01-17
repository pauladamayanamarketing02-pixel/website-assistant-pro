import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type ImportType =
  | "Social Media Posts"
  | "Content Media Posts"
  | "GMB Posts"
  | "Email Marketing"
  | "Ads Marketing";

type CategoryRow = {
  id: string;
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

const MOCK_ROWS: CategoryRow[] = [
  {
    id: "cat-1",
    category: "Promo",
    socialMediaPosts: 12,
    contentMediaPosts: 6,
    gmbPosts: 4,
    emailMarketing: 3,
    adsMarketing: 2,
  },
  {
    id: "cat-2",
    category: "Edukasi",
    socialMediaPosts: 18,
    contentMediaPosts: 10,
    gmbPosts: 5,
    emailMarketing: 6,
    adsMarketing: 1,
  },
  {
    id: "cat-3",
    category: "Testimoni",
    socialMediaPosts: 7,
    contentMediaPosts: 3,
    gmbPosts: 2,
    emailMarketing: 1,
    adsMarketing: 0,
  },
];

export default function ContentCreation() {
  const { toast } = useToast();
  const [lastImportType, setLastImportType] = React.useState<ImportType | null>(null);

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
              <Button type="button" variant="secondary">Import</Button>
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
        <CardHeader className="space-y-1">
          <CardTitle>Manajemen Content</CardTitle>
          {lastImportType ? (
            <p className="text-sm text-muted-foreground">Terakhir dipilih: {lastImportType}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {MOCK_ROWS.map((row) => (
                <TableRow key={row.id}>
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
                      onClick={() =>
                        toast({
                          title: "View Details",
                          description: `Detail kategori: ${row.category} (sementara placeholder).`,
                        })
                      }
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
