import { useEffect, useState } from 'react';
import { CreditCard, Receipt, Check, Clock, AlertCircle, Wallet, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  packages: {
    name: string;
  } | null;
}

interface ActivePackage {
  packages: {
    name: string;
    price: number;
  };
  started_at: string;
}

const statusConfig: Record<string, { icon: typeof Check; className: string }> = {
  paid: { icon: Check, className: 'bg-accent/10 text-accent' },
  pending: { icon: Clock, className: 'bg-primary/10 text-primary' },
  overdue: { icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

// Top-up duration options with discounts
const topUpOptions = [
  { months: 1, label: '1 Month', discount: 0 },
  { months: 6, label: '6 Months', discount: 5 },
  { months: 12, label: '12 Months', discount: 10 },
  { months: 24, label: '24 Months', discount: 15 },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activePackage, setActivePackage] = useState<ActivePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user) return;

      // Fetch invoices
      const { data: invoiceData } = await (supabase as any)
        .from('invoices')
        .select(
          `
          id, amount, status, paid_at, created_at,
          packages (name)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invoiceData) {
        setInvoices((invoiceData as any) || []);
      }

      // Fetch active package
      const { data: pkgData } = await (supabase as any)
        .from('user_packages')
        .select(
          `
          started_at,
          packages (name, price)
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (pkgData) {
        setActivePackage(pkgData as any);
      }

      setLoading(false);
    };

    fetchBillingData();
  }, [user]);

  const calculatePrice = (months: number, discount: number) => {
    if (!activePackage) return 0;
    const basePrice = activePackage.packages.price * months;
    const discountAmount = (basePrice * discount) / 100;
    return basePrice - discountAmount;
  };

  const handleTopUp = (months: number) => {
    setSelectedDuration(months);
    toast({
      title: 'Coming Soon',
      description: `Top-up for ${months} month(s) will be available soon. Payment integration is in development.`,
    });
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Generate CSV content
    const csvContent = [
      'Invoice Details',
      '',
      `Invoice ID,${invoice.id}`,
      `Package,${invoice.packages?.name || 'N/A'}`,
      `Amount,$${invoice.amount}`,
      `Status,${invoice.status}`,
      `Created Date,${new Date(invoice.created_at).toLocaleDateString()}`,
      `Paid Date,${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : 'Not Paid'}`,
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.id.slice(0, 8)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Invoice has been downloaded.',
    });
  };

  const handleDownloadAllInvoices = () => {
    if (invoices.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Invoices',
        description: 'There are no invoices to download.',
      });
      return;
    }

    // Generate CSV content for all invoices
    const headers = 'Invoice ID,Package,Amount,Status,Created Date,Paid Date';
    const rows = invoices.map(invoice => 
      `${invoice.id},${invoice.packages?.name || 'N/A'},$${invoice.amount},${invoice.status},${new Date(invoice.created_at).toLocaleDateString()},${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : 'Not Paid'}`
    );
    const csvContent = [headers, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'All invoices have been downloaded.',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payments</p>
      </div>

      {/* Active Package Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activePackage ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{activePackage.packages.name}</p>
                <p className="text-sm text-muted-foreground">
                  Active since {new Date(activePackage.started_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">${activePackage.packages.price}</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* Top Up Balance */}
      {activePackage && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Extend Subscription</CardTitle>
                <CardDescription>Pre-pay for multiple months and save</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topUpOptions.map((option) => {
                const totalPrice = calculatePrice(option.months, option.discount);
                const originalPrice = activePackage.packages.price * option.months;
                const savings = originalPrice - totalPrice;
                
                return (
                  <Card 
                    key={option.months} 
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedDuration === option.months && "border-primary ring-2 ring-primary/20"
                    )}
                    onClick={() => handleTopUp(option.months)}
                  >
                    <CardContent className="pt-6 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">{option.label}</span>
                      </div>
                      
                      {option.discount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Save {option.discount}%
                        </Badge>
                      )}
                      
                      <div>
                        <p className="text-2xl font-bold text-foreground">${totalPrice.toFixed(0)}</p>
                        {option.discount > 0 && (
                          <p className="text-sm text-muted-foreground line-through">${originalPrice}</p>
                        )}
                      </div>
                      
                      {savings > 0 && (
                        <p className="text-xs text-primary">You save ${savings.toFixed(0)}</p>
                      )}
                      
                      <Button 
                        variant={selectedDuration === option.months ? "default" : "outline"} 
                        size="sm" 
                        className="w-full"
                      >
                        Select
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your invoices and payments</CardDescription>
              </div>
            </div>
            {invoices.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownloadAllInvoices}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const config = statusConfig[invoice.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", config.className)}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {invoice.packages?.name || 'Package'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${invoice.amount}</p>
                        <Badge variant="outline" className={config.className}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDownloadInvoice(invoice)}
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
