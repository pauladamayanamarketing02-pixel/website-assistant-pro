import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Ga4Script } from '@/components/analytics/Ga4Script';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Ga4Script />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}