import { useEffect, useState } from "react";
import { Package, Check, ArrowUpRight, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BillingContent } from "./components/BillingContent";

interface UserPackage {
  id: string;
  status: string;
  started_at: string;
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
  pro: "scale", // Pro users get recommended Scale
  optimize: "scale",
  scale: "dominate",
  dominate: "", // Already at top
};

export default function MyPackage() {
  const { user } = useAuth();
  const [activePackage, setActivePackage] = useState<UserPackage | null>(null);
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!user) return;

      // Fetch user's active package
      const { data: userPkg } = await supabase
        .from("user_packages")
        .select(
          `
          id, status, started_at,
          packages (name, type, description, features, price)
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active")
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
          })) as AvailablePackage[]
        );
      }

      setLoading(false);
    };

    fetchPackages();
  }, [user]);

  // Filter packages to only show those with higher price than active package
  // If Pro package, recommend Scale
  const getUpgradePackages = () => {
    if (!activePackage) {
      return availablePackages;
    }

    const currentPrice = activePackage.packages.price || 0;
    const currentType = activePackage.packages.type?.toLowerCase() || "";
    const recommendedType = packageUpgradeRecommendations[currentType] || "";

    // Filter to higher priced packages
    let upgrades = availablePackages.filter(
      (pkg) => pkg.name !== activePackage.packages.name && pkg.price > currentPrice
    );

    // Sort so recommended package comes first
    if (recommendedType) {
      upgrades = upgrades.sort((a, b) => {
        if (a.type === recommendedType) return -1;
        if (b.type === recommendedType) return 1;
        return a.price - b.price;
      });
    }

    return upgrades;
  };

  const upgradePackages = getUpgradePackages();
  const currentType = activePackage?.packages.type?.toLowerCase() || "";
  const recommendedType = packageUpgradeRecommendations[currentType] || "";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Package</h1>
        <p className="text-muted-foreground">View your active package and available upgrades</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* LEFT: Active Package */}
        <div className="space-y-4">
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
                        Active since {new Date(activePackage.started_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-primary/10 text-primary">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{activePackage.packages.description}</p>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">What’s included:</p>
                  <ul className="space-y-2">
                    {activePackage.packages.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-2xl font-bold text-foreground">
                    ${activePackage.packages.price}
                    <span className="text-sm font-normal text-muted-foreground"> /month</span>
                  </p>
                </div>
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {activePackage ? "Upgrade Options" : "Available Packages"}
          </h2>

          {upgradePackages.length > 0 ? (
            <div className="grid gap-4">
              {upgradePackages.map((pkg) => {
                const isRecommended = pkg.type === recommendedType;

                return (
                  <Card
                    key={pkg.id}
                    className={
                      "hover:border-primary/30 transition-colors " +
                      (isRecommended ? "border-primary ring-2 ring-primary/20" : "")
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {isRecommended && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="font-bold text-foreground text-lg">
                          ${pkg.price}
                          <span className="text-sm font-normal text-muted-foreground">/month</span>
                        </p>
                        <Button variant={isRecommended ? "default" : "outline"} size="sm">
                          Upgrade
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
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

      {/* Billing moved here */}
      <section className="pt-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Billing</h2>
            <p className="text-muted-foreground">Manage your subscription and payments</p>
          </div>
        </div>

        <div className="mt-4">
          <BillingContent showTitle={false} />
        </div>
      </section>
    </div>
  );
}
