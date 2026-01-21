import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PackageCard from '@/components/onboarding/PackageCard';
import { growingPackages, type GrowingPackage } from '@/data/growingPackages';

type DbAddOn = { id: string; addOnKey: string; label: string; pricePerUnit: number; unitStep: number; unit: string };

interface Package {
  id: string;
  name: string;
  type: 'starter' | 'growth' | 'pro';
  description: string;
  price: number;
  features: string[];
}

// NOTE: Optional Add-ons are intentionally DB-driven.
// If the DB has no active add-ons for a package, we show none.

export default function SelectPackage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [growingDbPackages, setGrowingDbPackages] = useState<GrowingPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessStage, setBusinessStage] = useState<'new' | 'growing'>('new');
  const [dbAddOnsByPackageId, setDbAddOnsByPackageId] = useState<Record<string, DbAddOn[]>>({});
  const [growingUsesDb, setGrowingUsesDb] = useState(false);

  useEffect(() => {
    // Get the business stage from session storage
    const stage = sessionStorage.getItem('onboarding_businessStage') as 'new' | 'growing' || 'new';
    setBusinessStage(stage);

    const fetchPackages = async () => {
      if (stage === 'growing') {
        // Prefer DB-driven growing packages so Super Admin can manage them
        try {
          const { data, error } = await (supabase as any)
            .from('packages')
            .select('*')
            .in('type', ['optimize', 'scale', 'dominate'])
            .eq('is_active', true)
            .order('price');

          if (error) throw error;

           const mapped: GrowingPackage[] = (data || []).map((pkg: any) => ({
            id: pkg.id,
            name: pkg.name,
            type: pkg.type,
            description: pkg.description,
            price: pkg.price,
            features: Array.isArray(pkg.features) ? pkg.features : JSON.parse((pkg.features as string) || '[]'),
          }));

            setGrowingDbPackages(mapped);
            // If DB call succeeded, we must respect DB result (even if empty) so only Active packages appear.
            setGrowingUsesDb(true);

           // Load DB add-ons for growing packages
           const pkgIds = mapped.map((p) => String(p.id)).filter(Boolean);
           if (pkgIds.length > 0) {
             const { data: addOnRows } = await (supabase as any)
               .from('package_add_ons')
               .select('package_id,add_on_key,label,price_per_unit,unit_step,unit')
               .in('package_id', pkgIds)
               .eq('is_active', true);

             const grouped: Record<string, DbAddOn[]> = {};
             ((addOnRows as any[]) || []).forEach((r) => {
               const pid = String(r.package_id);
               if (!grouped[pid]) grouped[pid] = [];
               grouped[pid].push({
                 id: String(r.add_on_key),
                  addOnKey: String(r.add_on_key),
                 label: String(r.label),
                 pricePerUnit: Number(r.price_per_unit ?? 0),
                 unitStep: Number(r.unit_step ?? 1),
                 unit: String(r.unit ?? 'unit'),
               });
             });
             setDbAddOnsByPackageId(grouped);
           }
        } catch (error) {
          console.error('Error fetching growing packages:', error);
          // Fallback to frontend-defined growing packages
          setGrowingDbPackages([]);
          setGrowingUsesDb(false);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .in('type', ['starter', 'growth', 'pro'])
          .eq('is_active', true)
          .order('price');

        if (error) throw error;

         if (data) {
           const mapped = data.map((pkg) => ({
             ...pkg,
             type: pkg.type as 'starter' | 'growth' | 'pro',
             features: Array.isArray(pkg.features) ? (pkg.features as string[]) : JSON.parse((pkg.features as string) || '[]'),
           }));

           setPackages(mapped);

           // Load DB add-ons for new business packages
           const pkgIds = mapped.map((p) => String((p as any).id)).filter(Boolean);
           if (pkgIds.length > 0) {
             const { data: addOnRows } = await (supabase as any)
               .from('package_add_ons')
               .select('package_id,add_on_key,label,price_per_unit,unit_step,unit')
               .in('package_id', pkgIds)
               .eq('is_active', true);

             const grouped: Record<string, DbAddOn[]> = {};
             ((addOnRows as any[]) || []).forEach((r) => {
               const pid = String(r.package_id);
               if (!grouped[pid]) grouped[pid] = [];
               grouped[pid].push({
                 id: String(r.add_on_key),
                  addOnKey: String(r.add_on_key),
                 label: String(r.label),
                 pricePerUnit: Number(r.price_per_unit ?? 0),
                 unitStep: Number(r.unit_step ?? 1),
                 unit: String(r.unit ?? 'unit'),
               });
             });
             setDbAddOnsByPackageId(grouped);
           }
         }
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handlePackageSelect = (pkgId: string, price: number, addOns: Record<string, number>) => {
    setSelectedPackage(pkgId);
    setTotalPrice(price);
    setSelectedAddOns(addOns);
  };

  const handleContinue = async () => {
    if (!user || !selectedPackage) return;

    setIsSubmitting(true);
    try {
      if (businessStage === 'new') {
        // Create user package for new business (from database)
        const { error: packageError } = await supabase.from('user_packages').insert({
          user_id: user.id,
          package_id: selectedPackage,
          status: 'active',
        });

        if (packageError) throw packageError;
      } else {
        // Growing business packages
        const selectedDbPkg = growingDbPackages.find((p) => p.id === selectedPackage);

        if (selectedDbPkg) {
          // DB-driven: selectedPackage is already the package_id
          const { error: userPkgError } = await supabase.from('user_packages').insert({
            user_id: user.id,
            package_id: selectedPackage,
            status: 'active',
          });
          if (userPkgError) throw userPkgError;
        } else {
          // Fallback (legacy): frontend-defined growing packages; ensure DB row exists
          const selectedGrowingPkg = growingPackages.find((p) => p.id === selectedPackage);
          if (selectedGrowingPkg) {
            const { data: existingPkg } = await supabase
              .from('packages')
              .select('id')
              .eq('type', selectedGrowingPkg.type)
              .eq('is_active', true)
              .maybeSingle();

            let packageId = existingPkg?.id;

            if (!packageId) {
              const { data: newPkg, error: createError } = await (supabase as any)
                .from('packages')
                .insert({
                  name: selectedGrowingPkg.name,
                  type: selectedGrowingPkg.type,
                  description: selectedGrowingPkg.description,
                  price: selectedGrowingPkg.price,
                  features: selectedGrowingPkg.features,
                  is_active: true,
                })
                .select('id')
                .single();

              if (createError) throw createError;
              packageId = newPkg?.id;
            }

            if (!packageId) throw new Error('Failed to get or create package');

            const { error: userPkgError } = await supabase.from('user_packages').insert({
              user_id: user.id,
              package_id: packageId,
              status: 'active',
            });

            if (userPkgError) throw userPkgError;
          }
        }
      }

      // Mark onboarding as completed
      const { error: businessError } = await supabase
        .from('businesses')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (businessError) {
        console.error('Error updating business:', businessError);
        throw businessError;
      }

      // Clear session storage
      sessionStorage.removeItem('onboarding_firstName');
      sessionStorage.removeItem('onboarding_lastName');
      sessionStorage.removeItem('onboarding_businessStage');
      sessionStorage.removeItem('onboarding_businessName');
      sessionStorage.removeItem('onboarding_businessType');
      sessionStorage.removeItem('onboarding_country');
      sessionStorage.removeItem('onboarding_city');
      sessionStorage.removeItem('onboarding_phoneNumber');

      const packageName = businessStage === 'new'
        ? packages.find(p => p.id === selectedPackage)?.name
        : (growingDbPackages.find(p => p.id === selectedPackage)?.name || growingPackages.find(p => p.id === selectedPackage)?.name);

      toast({
        title: 'Welcome aboard!',
        description: `Your ${packageName} package is now active.`,
      });

      navigate('/dashboard/user');
    } catch (error: any) {
      console.error('Error in handleContinue:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save package. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading packages...</div>
      </div>
    );
  }

  const displayPackages =
    businessStage === 'new' ? packages : (growingUsesDb ? growingDbPackages : growingPackages);
  const getAddOns = (pkg: any) => {
    const pkgId = String(pkg?.id ?? '');
    const fromDb = pkgId && dbAddOnsByPackageId[pkgId];
    return fromDb && fromDb.length > 0 ? fromDb : [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <Button
        variant="ghost"
        onClick={() => navigate('/onboarding/online-presence')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="max-w-6xl mx-auto space-y-8 pt-8 animate-fade-in">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-primary" />
        </div>

        <div className="text-center space-y-2">
          <div className="text-sm font-medium text-primary mb-2">STEP 4</div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Choose Your Package</h1>
          <p className="text-muted-foreground">
            {businessStage === 'new' 
              ? 'Select the plan that fits your new business needs'
              : 'Select the plan to grow your existing business'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              name={pkg.name}
              type={pkg.type as any}
              description={pkg.description}
              basePrice={pkg.price}
              features={pkg.features}
              addOns={getAddOns(pkg)}
              isPopular={businessStage === 'new' ? pkg.type === 'growth' : pkg.type === 'scale'}
              isSelected={selectedPackage === pkg.id}
              onSelect={(price, addOns) => handlePackageSelect(pkg.id, price, addOns)}
            />
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={isSubmitting || !selectedPackage}
            className="px-8"
          >
            {isSubmitting ? 'Setting up...' : selectedPackage ? `Continue with $${totalPrice}/month` : 'Select a package to continue'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
