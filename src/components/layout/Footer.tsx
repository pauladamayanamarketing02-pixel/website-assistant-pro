import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy text-sidebar-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">E</span>
              </div>
              <span className="text-xl font-bold">EasyMarketingAssist</span>
            </Link>
            <p className="text-sm text-sidebar-foreground/70 max-w-xs">
              Your dedicated marketing assist for growing your business online. Personal support, not a big agency.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/services', label: 'Services' },
                { href: '/packages', label: 'Packages' },
                { href: '/blog', label: 'Blog' },
                { href: '/about', label: 'About Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-sidebar-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Services</h4>
            <ul className="space-y-2">
              {[
                'Google Business Profile',
                'Social Media Posting',
                'Website Development',
                'Blog & SEO Content',
              ].map((service) => (
                <li key={service}>
                  <span className="text-sm text-sidebar-foreground/70">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                hello@easymarketingassist.com
              </li>
              <li className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                <Phone className="h-4 w-4 text-primary" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start gap-2 text-sm text-sidebar-foreground/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                Available worldwide for remote clients
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-sidebar-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-sidebar-foreground/60">
              © {new Date().getFullYear()} EasyMarketingAssist. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-sidebar-foreground/60 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-sidebar-foreground/60 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}