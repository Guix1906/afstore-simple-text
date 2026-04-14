import { motion } from 'motion/react';

export const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[3/4] w-full bg-brand-card/30 rounded-2xl animate-pulse overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div className="h-4 w-3/4 bg-brand-card/50 rounded animate-pulse" />
      <div className="h-4 w-1/4 bg-brand-card/30 rounded animate-pulse" />
    </div>
  );
};

export const SectionSkeleton = ({ titleWidth = 'w-48', count = 4 }) => {
  return (
    <div className="py-8 px-4 space-y-6">
      <div className={`h-6 ${titleWidth} bg-brand-card/50 rounded animate-pulse`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="px-4 py-6">
      <div className="w-full aspect-square md:aspect-[21/9] bg-brand-card/30 rounded-3xl animate-pulse overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 to-transparent animate-pulse" />
      </div>
    </div>
  );
};
