import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import PriceDisplay from '../ui/PriceDisplay';
import StableImage from '../ui/StableImage';
import { DEFAULT_IMAGE_FALLBACK, getProductImageOrFallback } from '../../utils/imageOptimizer';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../hooks/useOptimizedQueries';
import { productService } from '../../services/productService';

interface ProductCardProps {
  product: Product;
}

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handlePrefetch = () => {
    // Prefetch product
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.product(product.id),
      queryFn: () => productService.getProductById(product.id),
      staleTime: 1000 * 60 * 10,
    });
    // Prefetch related
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.productsByCategory(product.category),
      queryFn: () => productService.getProductsByCategory(product.category, 0, 8),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <div
      onClick={() => navigate(`/produto/${product.id}`, { state: { category: product.category } })}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="group cursor-pointer flex flex-col h-full active:scale-[0.98] transition-all duration-300 touch-manipulation"
    >
      {/* Image Block */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-card border border-brand-border/40">
        <StableImage
          src={getProductImageOrFallback(product.images, 500)}
          fallbackSrc={DEFAULT_IMAGE_FALLBACK}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
          referrerPolicy="no-referrer"
          decoding="async"
          fetchPriority="low"
        />

        {/* Badges - Simplified for mobile performance */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isBestSeller && (
            <span className="bg-brand-gold text-black text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
              Pop
            </span>
          )}
          {product.isOnSale && (
            <span className="bg-brand-danger text-brand-text text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
              SALE
            </span>
          )}
        </div>
      </div>

      {/* Info Block */}
      <div className="pt-3 px-1 flex-1 flex flex-col justify-between gap-1">
        <div>
          <h3 className="text-[10px] font-bold text-white/90 leading-snug line-clamp-1 tracking-widest uppercase mb-0.5">
            {product.name}
          </h3>
          {product.sizes && product.sizes.length > 0 && (
            <p className="text-[8px] font-medium text-brand-text-muted uppercase tracking-widest">
              {product.sizes.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>

        <PriceDisplay
          price={product.price}
          originalPrice={product.originalPrice}
          discount={product.discount}
          className="mt-1"
          size="sm"
        />
      </div>
    </div>
  );
});

export default ProductCard;



