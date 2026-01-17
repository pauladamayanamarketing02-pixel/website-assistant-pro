import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import AddContentItemPage, { type BusinessOption, type LookupOption } from "./content-creation/AddContentItemPage";
import ManageLookupsDialog, { type LookupTab } from "./content-creation/ManageLookupsDialog";

type SortDirection = "asc" | "desc";

type ContentItemRow = {
  id: string;
  businessId: string;
  businessName: string;
  categoryName: string;
  contentTypeName: string;
  title: string;
  createdAt: string;
};

function safeName(name: string | null | undefined) {
  return (name ?? "(Unnamed)").trim() || "(Unnamed)";
}

export default function ContentCreation() {
  const { toast } = useToast();

  const [view, setView] = React.useState<"list" | "add">("list");
  const [manageOpen, setManageOpen] = React.useState(false);
  const [manageTab, setManageTab] = React.useState<LookupTab>("category");

  const [lastImportType, setLastImportType] = React.useState<string | null>(null);

  const [businesses, setBusinesses] = React.useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string>("all");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const [categories, setCategories] = React.useState<LookupOption[]>([]);
  const [contentTypes, setContentTypes] = React.useState<LookupOption[]>([]);

  const [items, setItems] = React.useState<ContentItemRow[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  const loadBusinesses = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, business_name")
      .order("business_name", { ascending: true, nullsFirst: false });

    if (error) {
      setBusinesses([]);
      return;
    }

    const list: BusinessOption[] = (data ?? []).map((b) => ({
      id: (b as any).id,
      name: safeName((b as any).business_name),
    }));

    setBusinesses(list);
  }, []);

  const loadLookups = React.useCallback(async () => {
    const [{ data: catData, error: catError }, { data: typeData, error: typeError }] = await Promise.all([
      supabase.from("content_categories" as any).select("id,name").order("name", { ascending: true }),
      supabase.from("content_types" as any).select("id,name").order("name", { ascending: true }),
    ]);

    if (catError) setCategories([]);
    else setCategories(((catData ?? []) as any).map((r: any) => ({ id: r.id, name: r.name })));

    if (typeError) setContentTypes([]);
    else setContentTypes(((typeData ?? []) as any).map((r: any) => ({ id: r.id, name: r.name })));
  }, []);

  const loadItems = React.useCallback(async () => {
    setLoadingItems(true);
    try {
      const { data, error } = await (supabase as any)
        .from("content_items")
        .select(
          `id, title, created_at,
           business:businesses(id, business_name),
           category:content_categories(id, name),
           content_type:content_types(id, name)`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: ContentItemRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        createdAt: r.created_at,
        businessId: r.business?.id ?? "",
        businessName: safeName(r.business?.business_name),
        categoryName: safeName(r.category?.name),
        contentTypeName: safeName(r.content_type?.name),
      }));

      setItems(mapped);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to load content", description: err?.message ?? "" });
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadBusinesses();
    void loadLookups();
    void loadItems();
  }, [loadBusinesses, loadLookups, loadItems]);

  const displayedItems = React.useMemo(() => {
    const filtered = selectedBusinessId === "all" ? items : items.filter((i) => i.businessId === selectedBusinessId);
    const dir = sortDirection === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => a.businessName.localeCompare(b.businessName, "en", { sensitivity: "base" }) * dir);
  }, [items, selectedBusinessId, sortDirection]);

  const onImport = (type: string) => {
    setLastImportType(type);
    toast({ title: "Import selected", description: `You selected import: ${type}` });
  };

  const openManage = (tab: LookupTab) => {
    setManageTab(tab);
    setManageOpen(true);
  };

  if (view === "add") {
    return (
      <>
        <AddContentItemPage
          businesses={businesses}
          categories={categories}
          contentTypes={contentTypes}
          onBack={() => setView("list")}
          onSaved={async () => {
            setView("list");
            await loadItems();
          }}
          onManageCategories={() => openManage("category")}
          onManageContentTypes={() => openManage("content")}
        />

        <ManageLookupsDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          tab={manageTab}
          onTabChange={setManageTab}
          onChanged={async () => {
            await loadLookups();
            await loadItems();
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Content Creation</h1>
          <p className="text-muted-foreground">Manage content items, categories, and types for your clients.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => setView("add")}>Add</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary">Import</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 w-64 bg-background border border-border">
              {contentTypes.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => onImport(t.name)}>
                  {t.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => openManage("content")}>Manage…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Content Management</CardTitle>
            {lastImportType ? <p className="text-sm text-muted-foreground">Last selected: {lastImportType}</p> : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Filter by business" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background border border-border">
                <SelectItem value="all">All Businesses</SelectItem>
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
              Sort: {sortDirection === "asc" ? "A–Z" : "Z–A"}
            </Button>

            <Button type="button" variant="secondary" onClick={() => openManage("category")}>
              Manage
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {displayedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.businessName}</TableCell>
                  <TableCell className="font-medium">{row.categoryName}</TableCell>
                  <TableCell>{row.contentTypeName}</TableCell>
                  <TableCell className="max-w-[420px] truncate">{row.title}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}

              {!loadingItems && displayedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No content items yet.
                  </TableCell>
                </TableRow>
              ) : null}

              {loadingItems ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ManageLookupsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        tab={manageTab}
        onTabChange={setManageTab}
        onChanged={async () => {
          await loadLookups();
          await loadItems();
        }}
      />
    </div>
  );
}
