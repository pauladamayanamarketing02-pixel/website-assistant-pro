import { useState, useEffect } from 'react';
import { Check, Plus, Minus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AddOn {
  id: string;
  label: string;
  pricePerUnit: number;
  unitStep: number;
  unit: string;
}

interface PackageCardProps {
  name: string;
  type: string;
  description: string;
  basePrice: number;
  features: string[];
  addOns?: AddOn[];
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
  isPopular = false,
  isSelected = false,
  onSelect,
}: PackageCardProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);

  useEffect(() => {
    let price = basePrice;
    addOns.forEach((addOn) => {
      const quantity = selectedAddOns[addOn.id] || 0;
      price += quantity * addOn.pricePerUnit;
    });
    setTotalPrice(price);
  }, [selectedAddOns, basePrice, addOns]);

  const handleAddOnChange = (addOnId: string, delta: number, unitStep: number) => {
    setSelectedAddOns((prev) => {
      const current = prev[addOnId] || 0;
      const newValue = Math.max(0, current + delta * unitStep);
      return { ...prev, [addOnId]: newValue };
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
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">${totalPrice}</span>
          <span className="text-muted-foreground">/ month</span>
        </div>

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
              <div
                key={addOn.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{addOn.label}</p>
                  <p className="text-xs text-muted-foreground">
                    +${addOn.pricePerUnit} per {addOn.unitStep} {addOn.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAddOnChange(addOn.id, -1, addOn.unitStep)}
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
                    onClick={() => handleAddOnChange(addOn.id, 1, addOn.unitStep)}
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
