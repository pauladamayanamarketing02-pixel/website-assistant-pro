import { Link } from 'react-router-dom';
import { ArrowRight, Globe, MessageCircle, Code, FileText, HeartHandshake, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/PublicLayout';

const services = [
  {
    icon: Globe,
    title: 'Google Business Profile (GMB) Setup',
    description: 'Get found by local customers searching for your services.',
    features: [
      'Complete profile setup and optimization',
      'Photos and business information',
      'Review response management',
      'Regular posts and updates',
      'Insights and performance tracking',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Social Media Posting',
    description: 'Build your brand with consistent, engaging social content.',
    features: [
      'Content calendar planning',
      'Custom graphics and visuals',
      'Platform-specific optimization',
      'Hashtag strategy',
      'Engagement and community building',
    ],
  },
  {
    icon: Code,
    title: 'Website Development',
    description: 'Beautiful, fast websites that convert visitors into customers.',
    features: [
      'Modern, responsive design',
      'Mobile-first approach',
      'SEO-friendly structure',
      'Fast loading speeds',
      'Easy content management',
    ],
  },
  {
    icon: FileText,
    title: 'Blog & SEO Content',
    description: 'Attract organic traffic with quality content that ranks.',
    features: [
      'Keyword research and strategy',
      'SEO-optimized blog posts',
      'Content that builds authority',
      'Regular publishing schedule',
      'Performance analytics',
    ],
  },
  {
    icon: HeartHandshake,
    title: 'Ongoing Marketing Assistance',
    description: 'Your dedicated assist for all marketing needs.',
    features: [
      'Weekly strategy calls',
      'Task management and execution',
      'Performance reporting',
      'Quick response times',
      'Flexible task prioritization',
    ],
  },
];

export default function Services() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Marketing Services That <span className="text-gradient">Actually Help</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              No fluff, no jargon. Just practical marketing support from your dedicated assist.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="space-y-12">
            {services.map((service, index) => (
              <Card
                key={service.title}
                className="overflow-hidden border shadow-soft animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="grid md:grid-cols-5 gap-6">
                  <CardHeader className="md:col-span-2 bg-muted/30 flex flex-col justify-center p-8">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                      <service.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                    <p className="mt-3 text-muted-foreground">{service.description}</p>
                  </CardHeader>
                  <CardContent className="md:col-span-3 p-8 flex items-center">
                    <ul className="grid sm:grid-cols-2 gap-3 w-full">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Check out our packages to find the right level of support for your business.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link to="/packages">
                  View Packages
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