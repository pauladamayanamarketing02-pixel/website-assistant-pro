import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Briefcase, TrendingUp, Sparkles, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HomePromoBanner } from '@/components/home/HomePromoBanner';
import { DomainSearchBar } from '@/components/order/DomainSearchBar';

const steps = [
  {
    step: '01',
    title: 'Choose Your Package',
    description: 'Pick the marketing assistance that fits your business needs and budget.',
  },
  {
    step: '02',
    title: 'Get Your Dedicated Assist',
    description: 'You\'ll be matched with a marketing assist who understands your goals.',
  },
  {
    step: '03',
    title: 'Watch Your Business Grow',
    description: 'Sit back while your assist handles the marketing, keeping you updated every step.',
  },
];

const whoItsFor = [
  {
    icon: Briefcase,
    title: 'New Business Owners',
    description: 'Just starting out and need help getting online presence established.',
  },
  {
    icon: TrendingUp,
    title: 'Growing Businesses',
    description: 'Ready to scale but don\'t have time for marketing tasks.',
  },
  {
    icon: Users,
    title: 'Solo Entrepreneurs',
    description: 'Wearing too many hats and need reliable marketing support.',
  },
];

const services = [
  {
    icon: Globe,
    title: 'Google Business Profile',
    description: 'Get found locally with optimized GMB setup and management.',
  },
  {
    icon: MessageCircle,
    title: 'Social Media Posting',
    description: 'Consistent, engaging posts that build your brand presence.',
  },
  {
    icon: Sparkles,
    title: 'Website Development',
    description: 'Beautiful, fast websites that convert visitors into customers.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-20 md:py-32 min-h-[calc(100vh-5rem)] flex items-center">
        {/* Promo banner overlays the hero (does not push content down) */}
        <div className="absolute inset-x-0 top-6 z-20">
          <HomePromoBanner />
        </div>

        <div className="container relative z-10">
          {/* Lower the hero content position */}
          <div className="mx-auto max-w-3xl text-center pt-10 md:pt-14">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-fade-in">
              Easy Digital Marketing for{' '}
              <span className="text-gradient">Busy Business Owners</span>
            </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Search a domain and get a professional website in minutes.
              </p>

              <div className="mt-10 mx-auto max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <DomainSearchBar
                  onSubmit={(domain) => {
                    navigate(`/order/choose-domain?domain=${encodeURIComponent(domain)}`);
                  }}
                />
              </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {['No contracts', 'Personal support', 'Affordable pricing'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.1),transparent)]" />
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Getting started is simple. Here's how we'll work together.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Who It's For
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Perfect for business owners who want to focus on what they do best.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {whoItsFor.map((item, index) => (
              <Card
                key={item.title}
                className="border-0 shadow-soft bg-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent mb-6">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What We Can Help With
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your marketing assist can handle a variety of tasks to grow your business.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service, index) => (
              <Card
                key={service.title}
                className="group hover:shadow-glow transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Grow Your Business?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Get your dedicated marketing assist today. No contracts, no agency overhead.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/packages">
                  View Packages
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}