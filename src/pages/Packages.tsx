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

const packages = [
  {
    name: 'Starter Package',
    subtitle: 'For New Businesses',
    price: '$299',
    period: '/month',
    description: 'Perfect for businesses just getting started with online marketing.',
    features: [
      'Google Business Profile setup',
      '8 social media posts/month',
      'Basic SEO optimization',
      'Monthly performance report',
      'Email support',
    ],
    popular: false,
    cta: 'Get Started',
  },
  {
    name: 'Growth Package',
    subtitle: 'For Active Businesses',
    price: '$599',
    period: '/month',
    description: 'For businesses ready to accelerate their marketing efforts.',
    features: [
      'Everything in Starter, plus:',
      '16 social media posts/month',
      '2 blog posts/month',
      'Weekly strategy call',
      'Priority support',
      'Custom graphics',
    ],
    popular: true,
    cta: 'Get Started',
  },
  {
    name: 'Website Package',
    subtitle: 'One-Time Build',
    price: '$1,999',
    period: 'one-time',
    description: 'A beautiful, professional website built for conversions.',
    features: [
      'Up to 5 pages',
      'Mobile-responsive design',
      'SEO-optimized structure',
      'Contact form integration',
      'Basic training session',
      '30 days of support',
    ],
    popular: false,
    cta: 'Get Quote',
  },
  {
    name: 'Monthly Marketing Assist',
    subtitle: 'Full Service',
    price: '$999',
    period: '/month',
    description: 'Your dedicated marketing assist for comprehensive support.',
    features: [
      'Everything in Growth, plus:',
      'Dedicated assist assigned',
      '4 blog posts/month',
      'Email marketing support',
      'Ad campaign management',
      'Weekly detailed reports',
      'Slack/WhatsApp access',
    ],
    popular: false,
    cta: 'Get Started',
  },
];

export default function Packages() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("website_faqs")
        .select("id,page,question,answer,sort_order,is_published,created_at,updated_at")
        .eq("page", "packages")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error) setFaqs((data ?? []) as FaqRow[]);
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
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg, index) => (
              <Card
                key={pkg.name}
                className={`relative flex flex-col animate-fade-in ${
                  pkg.popular ? 'border-primary shadow-glow' : 'shadow-soft'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardDescription className="text-primary font-medium">
                    {pkg.subtitle}
                  </CardDescription>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{pkg.price}</span>
                    <span className="text-muted-foreground">{pkg.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    {pkg.description}
                  </p>
                  <ul className="space-y-3">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/auth">
                      {pkg.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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