import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Minus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { computeDiscountedTotal, type DurationOption } from '@/lib/packageDurations';

interface AddOn {
  id: string;
  addOnKey?: string;
  label: string;
  pricePerUnit: number;
  unitStep: number;
  unit: string;
  maxQuantity?: number | null;
}

interface PackageCardProps {
  name: string;
  type: string;
  description: string;
  basePrice: number;
  features: string[];
  addOns?: AddOn[];
  durationOptions?: DurationOption[];
  selectedDurationMonths?: number | null;
  onDurationChange?: (months: number) => void;
  isPopular?: boolean;
  isSelected?: boolean;
  onSelect: (totalPrice: number, addOns: Record<string, number>) => void;
}

const packageColors: Record<string, string> = {
  starter: 'border-green-500/30 bg-green-500/5',
  growth: 'border-blue-500/30 bg-blue-500/5',
  pro: 'border-red-500/30 bg-red-500/5',
  optimize: 'border-emerald-500/30 bg-emerald-500/5',
  scale: 'border-violet-500/30 bg-violet-500/5',
  dominate: 'border-amber-500/30 bg-amber-500/5',
};

const packageBadgeColors: Record<string, string> = {
  starter: 'bg-green-500/10 text-green-600 border-green-500/20',
  growth: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  pro: 'bg-red-500/10 text-red-600 border-red-500/20',
  optimize: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  scale: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  dominate: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export default function PackageCard({
  name,
  type,
  description,
  basePrice,
  features,
  addOns = [],
  durationOptions = [],
  selectedDurationMonths = null,
  onDurationChange,
  isPopular = false,
  isSelected = false,
  onSelect,
}: PackageCardProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});

  // In onboarding UI we don't want to show the redundant 1-month option (it's the implicit default).
  const visibleDurationOptions = useMemo(
    () => durationOptions.filter((d) => d.months !== 1),
    [durationOptions]
  );

  const totalPrice = useMemo(() => {
    return addOns.reduce((sum, addOn) => {
      const quantity = selectedAddOns[addOn.id] || 0;
      return sum + quantity * addOn.pricePerUnit;
    }, basePrice);
  }, [addOns, basePrice, selectedAddOns]);

  const selectedDuration = useMemo(() => {
    const months = selectedDurationMonths ?? 1;
    const opt = durationOptions.find((d) => d.months === months);
    return opt ?? { months: 1, label: '1 Month', discountPercent: 0, isFromDb: false };
  }, [durationOptions, selectedDurationMonths]);

  const discountedTotal = useMemo(() => {
    return computeDiscountedTotal({
      monthlyPrice: totalPrice,
      months: selectedDuration.months,
      discountPercent: selectedDuration.discountPercent,
    });
  }, [selectedDuration.discountPercent, selectedDuration.months, totalPrice]);

  // Keep parent (SelectPackage) in sync when user changes add-ons on the selected card.
  useEffect(() => {
    if (!isSelected) return;
    onSelect(totalPrice, selectedAddOns);
  }, [isSelected, onSelect, selectedAddOns, totalPrice]);

  const handleAddOnChange = (addOnId: string, delta: number, unitStep: number, maxQuantity?: number | null) => {
    setSelectedAddOns((prev) => {
      const current = prev[addOnId] || 0;
      const rawNext = Math.max(0, current + delta * unitStep);
      const next =
        maxQuantity === null || maxQuantity === undefined
          ? rawNext
          : Math.min(Math.max(0, Number(maxQuantity)), rawNext);
      return { ...prev, [addOnId]: next };
    });
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-300 hover:shadow-lg cursor-pointer',
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/50',
        packageColors[type]
      )}
      onClick={() => onSelect(totalPrice, selectedAddOns)}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            MOST POPULAR
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2 pt-6">
        <Badge variant="outline" className={cn('w-fit mb-2', packageBadgeColors[type])}>
          {type.toUpperCase()}
        </Badge>
        <CardTitle className="text-xl">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">${totalPrice}</span>
            <span className="text-muted-foreground">/ month</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total {selectedDuration.label}: <span className="font-medium text-foreground">${discountedTotal}</span>
            {selectedDuration.discountPercent > 0 && (
              <span className="ml-2">(Save {selectedDuration.discountPercent}%)</span>
            )}
          </div>
        </div>

        {visibleDurationOptions.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border p-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-foreground">Duration</div>
            <RadioGroup
              value={selectedDuration.months === 1 ? '' : String(selectedDuration.months)}
              onValueChange={(v) => onDurationChange?.(Number(v))}
              className="grid gap-2"
            >
              {visibleDurationOptions.map((opt) => (
                <div key={opt.months} className="flex items-center gap-2">
                  <RadioGroupItem value={String(opt.months)} id={`${type}-dur-${opt.months}`} />
                  <Label htmlFor={`${type}-dur-${opt.months}`} className="cursor-pointer">
                    {opt.label}
                    {opt.discountPercent > 0 ? ` (-${opt.discountPercent}%)` : ''}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {addOns.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Optional Add-ons</p>
            {addOns.map((addOn) => (
              // When maxQuantity is set, prevent the user from exceeding it.
              <div
                key={addOn.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold">{addOn.addOnKey ?? addOn.id}</p>
                  <p className="text-xs text-muted-foreground">{addOn.label}</p>
                  <p className="text-xs text-muted-foreground">
                    +${addOn.pricePerUnit} for {addOn.unitStep} {addOn.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAddOnChange(addOn.id, -1, addOn.unitStep, addOn.maxQuantity)}
                    disabled={(selectedAddOns[addOn.id] || 0) === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {selectedAddOns[addOn.id] || 0}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAddOnChange(addOn.id, 1, addOn.unitStep, addOn.maxQuantity)}
                    disabled={
                      addOn.maxQuantity !== null &&
                      addOn.maxQuantity !== undefined &&
                      (selectedAddOns[addOn.id] || 0) >= Number(addOn.maxQuantity)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          className={cn('w-full mt-2', isSelected && 'bg-primary')}
          variant={isSelected ? 'default' : 'outline'}
        >
          {isSelected ? 'Selected' : 'Select This Package'}
        </Button>
      </CardContent>
    </Card>
  );
}
