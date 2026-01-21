import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Star } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/PublicLayout";

import type { Database } from "@/integrations/supabase/types";

type FaqRow = Database["public"]["Tables"]["website_faqs"]["Row"];
type PackageRow = Database["public"]["Tables"]["packages"]["Row"];

export default function Packages() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch FAQs
      const { data, error } = await supabase
        .from("website_faqs")
        .select("id,page,question,answer,sort_order,is_published,created_at,updated_at")
        .eq("page", "packages")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error) setFaqs((data ?? []) as FaqRow[]);

      // Fetch public packages
      const { data: pkgData } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_public", true)
        .order("created_at", { ascending: true });

      if (pkgData) setPackages(pkgData as PackageRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the package that fits your needs. No hidden fees, no long-term contracts.
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 md:py-28">
        <div className="container">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading packages...</p>
          ) : packages.length === 0 ? (
            <p className="text-center text-muted-foreground">No packages available.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, i) => {
                const features = Array.isArray(pkg.features) ? pkg.features : [];
                return (
                  <Card key={pkg.id} className="relative flex flex-col shadow-soft animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <CardHeader className="text-center pb-4">
                      <CardDescription className="text-primary font-medium uppercase text-xs">{pkg.type}</CardDescription>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">${Number(pkg.price ?? 0).toFixed(0)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {pkg.description && <p className="text-sm text-muted-foreground text-center mb-6">{pkg.description}</p>}
                      <ul className="space-y-3">
                        {features.map((f: any, j: number) => (
                          <li key={j} className="flex items-start gap-3 text-sm">
                            <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{String(f)}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                      <Button className="w-full" variant="default" asChild>
                        <Link to="/auth">Get Started<ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Common Questions
            </h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            {(faqs.length
              ? faqs.map((f) => ({ q: f.question, a: f.answer, id: f.id }))
              : [
                  {
                    id: "fallback-1",
                    q: "Can I change packages later?",
                    a: "Absolutely! You can upgrade or downgrade your package at any time. Changes take effect on your next billing cycle.",
                  },
                  {
                    id: "fallback-2",
                    q: "Is there a long-term contract?",
                    a: "No contracts! All our monthly packages are month-to-month. Cancel anytime with no penalties.",
                  },
                  {
                    id: "fallback-3",
                    q: "How do I communicate with my assist?",
                    a: "Depending on your package, you can communicate via email, our dashboard, or direct messaging apps like Slack or WhatsApp.",
                  },
                  {
                    id: "fallback-4",
                    q: "What if I need something custom?",
                    a: "We love custom requests! Contact us and we'll create a package that fits your unique needs.",
                  },
                ]
            ).map((faq) => (
              <Card key={faq.id} className="shadow-soft">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Get Your Marketing Assist?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Login or create an account to get started today.
            </p>
            <div className="mt-10">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Login to Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}