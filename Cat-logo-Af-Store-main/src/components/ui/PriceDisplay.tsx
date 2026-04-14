import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useMemo } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  discount?: number;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg';
}

export default function PriceDisplay({ price, originalPrice, discount, className, size = 'sm' }: PriceDisplayProps) {
  const formatter = useMemo(() => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), 
  []);

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={cn(
          'font-sans font-bold text-brand-gold tracking-tight',
          size === 'lg' ? 'text-2xl md:text-3xl' : 
          size === 'base' ? 'text-lg' :
          size === 'xs' ? 'text-[11px]' : 'text-[13px]'
        )}>
          {formatter.format(price)}
        </span>
        {originalPrice && (
          <span className="text-[10px] font-sans font-medium text-brand-text-muted line-through opacity-40">
            {formatter.format(originalPrice)}
          </span>
        )}
      </div>
      {discount && (
        <span className="text-[9px] font-bold text-brand-whatsapp uppercase tracking-wider">
          OFF • {discount}%
        </span>
      )}
    </div>
  );
}

