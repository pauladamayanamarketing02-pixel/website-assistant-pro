import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MessageCircle, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be less than 255 characters'),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

const SETTINGS_KEY = 'contact_other_ways';

type ContactKey = "email" | "phone" | "whatsapp" | "location";

type ContactInfoItem = {
  key: ContactKey;
  icon: typeof Mail;
  title: string;
  detail: string;
  description: string;
  /** Only used when key === "whatsapp" */
  openingMessage?: string;
};

const defaultContactInfo: ContactInfoItem[] = [
  {
    key: "email",
    icon: Mail,
    title: "Email Us",
    detail: "hello@easymarketingassist.com",
    description: "We typically respond within 24 hours",
  },
  {
    key: "phone",
    icon: Phone,
    title: "Call Us",
    detail: "+1 (555) 123-4567",
    description: "Mon-Fri from 9am to 5pm EST",
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    title: "WhatsApp",
    detail: "+1 (555) 123-4567",
    description: "Quick responses for existing clients",
    openingMessage: "Hallo !!!",
  },
  {
    key: "location",
    icon: MapPin,
    title: "Location",
    detail: "Remote / Worldwide",
    description: "Available for global clients",
  },
];

const iconByKey = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  location: MapPin,
} as const;

function toWhatsAppPhone(input: string) {
  // WhatsApp phone param supports digits only (no +, spaces, (), -)
  return (input ?? "").replace(/\D/g, "");
}

function buildWhatsAppUrl(phone: string, message: string) {
  const normalized = toWhatsAppPhone(phone);
  if (!normalized) return null;
  const text = encodeURIComponent(message || "Hallo !!!");
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${text}`;
}

function buildOutlookComposeUrl(email: string) {
  const to = (email ?? "").trim();
  if (!to) return null;
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}`;
}

function parseContactInfo(value: unknown): ContactInfoItem[] {
  if (!Array.isArray(value)) return defaultContactInfo;

  const normalized = value
    .map((raw) => {
      const obj = raw as any;
      const key = obj?.key as keyof typeof iconByKey | undefined;
      const Icon = key ? iconByKey[key] : undefined;
      if (!Icon || !key) return null;

      return {
        key,
        icon: Icon,
        title: typeof obj.title === "string" ? obj.title : "",
        detail: typeof obj.detail === "string" ? obj.detail : "",
        description: typeof obj.description === "string" ? obj.description : "",
        openingMessage: typeof obj.openingMessage === "string" ? obj.openingMessage : undefined,
      } satisfies ContactInfoItem;
    })
    .filter(Boolean) as ContactInfoItem[];

  // If malformed, fallback
  return normalized.length ? normalized : defaultContactInfo;
}


export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfoItem[]>(defaultContactInfo);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from('website_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (!error) setContactInfo(parseContactInfo(data?.value));
    })();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject,
        message: result.data.message,
        source: "contact_page",
        status: "new",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      };

      const { error } = await (supabase as any).from("website_inquiries").insert(payload);
      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We\"ll get back to you as soon as possible.",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact submit error:", err);
      toast({
        title: "Failed to send",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Let's <span className="text-gradient">Connect</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question or ready to get started? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <Card className="shadow-soft animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={errors.subject ? 'border-destructive' : ''}
                    />
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Other Ways to Reach Us</h2>
                <p className="text-muted-foreground">
                  Choose the method that works best for you.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {contactInfo.map((info) => {
                  const href =
                    info.key === "email"
                      ? buildOutlookComposeUrl(info.detail)
                      : info.key === "whatsapp"
                        ? buildWhatsAppUrl(info.detail, info.openingMessage ?? "Hallo !!!")
                        : null;

                  const CardInner = (
                    <Card key={info.key} className="shadow-soft">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <info.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground">{info.title}</h3>
                            <p className="text-foreground break-words">{info.detail}</p>
                            <p className="text-sm text-muted-foreground break-words">{info.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return href ? (
                    <a
                      key={info.key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                      aria-label={info.key === "email" ? `Email ke ${info.detail}` : `WhatsApp ke ${info.detail}`}
                    >
                      {CardInner}
                    </a>
                  ) : (
                    CardInner
                  );
                })}
              </div>

              {/* Existing Client CTA */}
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">Already a Client?</h3>
                  <p className="text-muted-foreground mb-4">
                    Login to access your dashboard and send messages directly to your assist.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/auth">
                      Login to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
