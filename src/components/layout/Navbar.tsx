import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWebsiteLayoutSettings } from "@/hooks/useWebsiteLayout";

export function Navbar() {
  const { settings } = useWebsiteLayoutSettings();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = useMemo(() => settings.header.navLinks ?? [], [settings.header.navLinks]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {settings.header.logoUrl ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted overflow-hidden">
              <img
                src={settings.header.logoUrl}
                alt={settings.header.logoAlt || settings.header.brandName}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">{settings.header.brandMarkText}</span>
            </div>
          )}
          <span className="text-xl font-bold text-foreground">{settings.header.brandName}</span>
        </Link>

        {/* Desktop Navigation (show from lg so tablet still uses the mobile menu) */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted",
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" asChild>
            <Link to={settings.header.secondaryCtaHref}>{settings.header.secondaryCtaLabel}</Link>
          </Button>
          <Button asChild>
            <Link to={settings.header.primaryCtaHref}>{settings.header.primaryCtaLabel}</Link>
          </Button>
        </div>

        {/* Mobile Menu Button (kept for tablet) */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md lg:hidden hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation (used for phone + tablet) */}
      {isOpen && (
        <div className="border-t border-border bg-background lg:hidden animate-fade-in">
          <div className="container py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to={settings.header.secondaryCtaHref} onClick={() => setIsOpen(false)}>
                  {settings.header.secondaryCtaLabel}
                </Link>
              </Button>
              <Button className="w-full" asChild>
                <Link to={settings.header.primaryCtaHref} onClick={() => setIsOpen(false)}>
                  {settings.header.primaryCtaLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}