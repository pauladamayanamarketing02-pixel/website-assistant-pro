import { useEffect, useState } from "react";
import { Package, Check, ArrowUpRight, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserPackage {
  id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  packages: {
    name: string;
    type: string;
    description: string;
    features: string[];
    price: number;
  };
}

interface AvailablePackage {
  id: string;
  name: string;
  type: string;
  description: string;
  features: string[];
  price: number;
}

// Package upgrade recommendations based on current package
const packageUpgradeRecommendations: Record<string, string> = {
  starter: "growth",
  growth: "pro",
  pro: "optimize",
  optimize: "scale",
  scale: "dominate",
  dominate: "custom",
  custom: "", // Already at top
};

const PACKAGE_TIER_ORDER = ["starter", "growth", "pro", "optimize", "scale", "dominate", "custom"] as const;

function normalizeTier(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function sortByTier(aNameOrType: string, bNameOrType: string): number {
  const a = normalizeTier(aNameOrType);
  const b = normalizeTier(bNameOrType);
  const ai = (PACKAGE_TIER_ORDER as readonly string[]).indexOf(a);
  const bi = (PACKAGE_TIER_ORDER as readonly string[]).indexOf(b);
  const aRank = ai === -1 ? Number.POSITIVE_INFINITY : ai;
  const bRank = bi === -1 ? Number.POSITIVE_INFINITY : bi;
  if (aRank !== bRank) return aRank - bRank;
  return a.localeCompare(b);
}

function formatPackageStatusLabel(status: string | null | undefined): string {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "pending") return "Awaiting Approval";
  if (s === "approved") return "Awaiting Payment";
  if (s === "active") return "Active";
  if (!s) return "—";
  // fallback for any legacy/custom status
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDMY(dateIso: string | null | undefined): string {
  if (!dateIso) return "";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB");
}

export default function MyPackage() {
  const { user } = useAuth();
  const [activePackage, setActivePackage] = useState<UserPackage | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!user) return;

      // Fetch user's account status (source of truth for the UI status badge)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError) {
        setAccountStatus((profile as any)?.account_status ?? null);
      }

      // Fetch user's active package
      const { data: userPkg } = await supabase
        .from("user_packages")
        .select(
          `
          id, status, started_at, expires_at,
          packages (name, type, description, features, price)
        `
        )
        .eq("user_id", user.id)
        // Show the latest package record even if not active yet.
        .in("status", ["pending", "approved", "active"])
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (userPkg) {
        const pkgObj = Array.isArray((userPkg as any).packages)
          ? (userPkg as any).packages[0]
          : (userPkg as any).packages;

        setActivePackage({
          ...(userPkg as any),
          packages: {
            ...(pkgObj as any),
            features: Array.isArray((pkgObj as any)?.features)
              ? (pkgObj as any).features
              : JSON.parse(((pkgObj as any)?.features as string) || "[]"),
          },
        } as UserPackage);
      }

      // Fetch all available packages
      const { data: allPkgs } = await supabase.from("packages").select("*").eq("is_active", true);

      if (allPkgs) {
        setAvailablePackages(
          (allPkgs as any[]).map((pkg) => ({
            ...(pkg as any),
            features: Array.isArray((pkg as any).features)
              ? (pkg as any).features
              : JSON.parse(((pkg as any).features as string) || "[]"),
          }))
            .sort((a, b) => sortByTier(a.type ?? a.name, b.type ?? b.name)) as AvailablePackage[]
        );
      }

      setLoading(false);
    };

    fetchPackages();
  }, [user]);

  // Filter packages to only show those with higher price than active package
  const getUpgradePackages = () => {
    if (!activePackage) {
      return availablePackages;
    }

    const currentType = normalizeTier(activePackage.packages.type);
    const currentName = normalizeTier(activePackage.packages.name);
    const recommendedType = normalizeTier(packageUpgradeRecommendations[currentType] || "");

    // Only recommend 1 tier above.
    if (!recommendedType) return [];

    const exact = availablePackages.find(
      (pkg) => normalizeTier(pkg.type) === recommendedType || normalizeTier(pkg.name) === recommendedType
    );

    // If not found, fall back to the next tier by our known order.
    if (exact) return [exact];

    const currentIndex = (PACKAGE_TIER_ORDER as readonly string[]).indexOf(currentType || currentName);
    const nextTier = currentIndex >= 0 ? (PACKAGE_TIER_ORDER as readonly string[])[currentIndex + 1] : undefined;
    if (!nextTier) return [];

    const fallback = availablePackages.find(
      (pkg) => normalizeTier(pkg.type) === nextTier || normalizeTier(pkg.name) === nextTier
    );

    return fallback ? [fallback] : [];
  };

  const upgradePackages = getUpgradePackages();
  const currentType = activePackage?.packages.type?.toLowerCase() || "";
  const recommendedType = packageUpgradeRecommendations[currentType] || "";

  const statusSource = accountStatus ?? activePackage?.status;
  const statusLabel = formatPackageStatusLabel(statusSource);
  const isActiveStatus = String(statusSource ?? "").toLowerCase().trim() === "active";
  const activeSinceLabel = isActiveStatus ? formatDMY(activePackage?.started_at) : "";
  const expiresOnLabel = isActiveStatus ? formatDMY(activePackage?.expires_at) : "";
  const statusDescription = !isActiveStatus
    ? statusLabel
    : activeSinceLabel
      ? `Active since ${activeSinceLabel}`
      : "Active";

  const hasUpgradeToScale = upgradePackages.some(
    (pkg) => normalizeTier(pkg.type) === "scale" || normalizeTier(pkg.name) === "scale" || normalizeTier(pkg.name).includes("scale")
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const currentFeaturesDesktop = activePackage ? activePackage.packages.features.slice(0, 6) : [];
  const currentFeaturesOverflow = activePackage
    ? Math.max(0, activePackage.packages.features.length - currentFeaturesDesktop.length)
    : 0;

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-foreground">My Package</h1>
        <p className="text-muted-foreground">View your active package and available upgrades</p>
      </div>

      <div className="flex-1 min-h-0 grid gap-6 lg:grid-cols-2 items-start">
        {/* LEFT: Active Package */}
        <div className="min-h-0 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Current Package</h2>

          {activePackage ? (
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{activePackage.packages.name}</CardTitle>
                      <CardDescription>
                        {!isActiveStatus ? (
                          statusDescription
                        ) : (
                          <span className="block">
                            {statusDescription}
                            {expiresOnLabel ? <span className="block">Expires On {expiresOnLabel}</span> : null}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-primary/10 text-primary">
                    {statusLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 min-w-0">
                <p className="text-muted-foreground">{activePackage.packages.description}</p>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">What’s included:</p>
                  {/* Mobile: show full list (page can scroll) */}
                  <ul className="space-y-2 lg:hidden">
                    {activePackage.packages.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 min-w-0">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground break-words whitespace-normal">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Desktop: limit list so the page fits 1 screen */}
                  <ul className="hidden lg:block space-y-2">
                    {currentFeaturesDesktop.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 min-w-0">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground break-words whitespace-normal">{feature}</span>
                      </li>
                    ))}
                    {currentFeaturesOverflow > 0 && (
                      <li className="text-xs text-muted-foreground pl-7">+{currentFeaturesOverflow} more…</li>
                    )}
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-2xl font-bold text-foreground">
                    ${activePackage.packages.price}
                    <span className="text-sm font-normal text-muted-foreground"> /month</span>
                  </p>
                </div>

                {hasUpgradeToScale && (
                  <div className="pt-2">
                    <Button className="w-full" variant="outline">
                      Renew Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No active package</h3>
                <p className="text-muted-foreground">Choose a package on the right to get started</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Upgrade Options */}
        <div className="min-h-0 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {activePackage ? "Upgrade Options" : "Available Packages"}
          </h2>

          {upgradePackages.length > 0 ? (
            <div className="grid gap-4">
              {upgradePackages.map((pkg) => {
                const isRecommended = normalizeTier(pkg.type) === normalizeTier(recommendedType);
                const desktopFeatures = pkg.features.slice(0, 6);
                const overflowCount = Math.max(0, pkg.features.length - desktopFeatures.length);

                return (
                  <Card
                    key={pkg.id}
                    className={
                      "group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md " +
                      (isRecommended
                        ? "border-primary/50 ring-2 ring-primary/15 bg-gradient-to-br from-primary/10 via-background to-background"
                        : "hover:border-primary/30 bg-gradient-to-br from-muted/30 via-background to-background")
                    }
                  >
                    {/* subtle decorative glow */}
                    <div
                      aria-hidden="true"
                      className={
                        "pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl opacity-0 transition-opacity group-hover:opacity-100 " +
                        (isRecommended ? "bg-primary/20" : "bg-muted")
                      }
                    />

                    <CardHeader className="space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg truncate">{pkg.name}</CardTitle>
                            {isRecommended && (
                              <Badge className="bg-primary text-primary-foreground">
                                <Star className="h-3 w-3 mr-1" />
                                Best value
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">{pkg.description}</CardDescription>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-foreground text-xl leading-none">${pkg.price}</div>
                          <div className="text-xs text-muted-foreground">/month</div>
                          {activePackage && (
                            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
                              +${Math.max(0, pkg.price - activePackage.packages.price)}/mo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 min-w-0">
                      <div className="rounded-lg border bg-card/50 p-3">
                        <p className="text-sm font-medium text-foreground">What you’ll get</p>
                        {/* Mobile: full list */}
                        <ul className="mt-3 space-y-2 lg:hidden">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                              <span className="break-words whitespace-normal">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Desktop: limited list */}
                        <ul className="hidden lg:block mt-3 space-y-2">
                          {desktopFeatures.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                              <span className="break-words whitespace-normal">{feature}</span>
                            </li>
                          ))}
                          {overflowCount > 0 && (
                            <li className="text-xs text-muted-foreground pl-7">+{overflowCount} more…</li>
                          )}
                        </ul>
                      </div>

                      <Button
                        variant={isRecommended ? "default" : "outline"}
                        className="w-full"
                      >
                        Upgrade to {pkg.name}
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        Upgrade anytime. Your team will be notified once payment is enabled.
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : activePackage ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">You have the best package!</h3>
                <p className="text-muted-foreground">You’re already on our highest tier package</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No packages available right now.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
