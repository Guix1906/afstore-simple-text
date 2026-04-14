import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'sale' | 'new' | 'default';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    gold: 'bg-brand-gold text-black border border-brand-gold/20',
    sale: 'bg-black text-brand-gold border border-white/10',
    new: 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30',
    default: 'bg-[#181818] text-brand-text-muted border border-white/5',
  };

  return (
    <span className={cn(
      'text-[9px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-[0.15em] shadow-sm',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
