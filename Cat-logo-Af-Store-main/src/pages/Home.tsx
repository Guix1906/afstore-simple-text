import { useMemo } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import HeroBanner from '../components/home/HeroBanner';
import CategoryTabs from '../components/layout/CategoryTabs';
import ProductSection from '../components/home/ProductSection';
import WhatsAppBanner from '../components/home/WhatsAppBanner';
import { useAllActiveProducts, QUERY_KEYS } from '../hooks/useOptimizedQueries';
import { SectionSkeleton, HeroSkeleton } from '../components/layout/Skeletons';
import { useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';

export default function Home() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useAllActiveProducts();

  const sections = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        catalog: [],
        bestSellers: [],
          newArrivals: [],
        onSale: [],
      };
    }
    
    return {
      catalog: products.slice(0, 8),
      bestSellers: products.filter(p => p.isBestSeller).slice(0, 4),
        newArrivals: products,
      onSale: products.filter(p => p.isOnSale).slice(0, 4)
    };
  }, [products]);


  // Prefetch de categorias comuns para navegação ultra-rápida (Native Feel)
  const handlePrefetch = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.productsByCategory(slug),
      queryFn: () => productService.getProductsByCategory(slug, 0, 8),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <PageWrapper>
      <div className="pt-16"> {/* Spacer for fixed header */}
        <div onMouseEnter={() => handlePrefetch('leggings')}>
          <CategoryTabs />
        </div>
        
        {isLoading ? (
          <>
            <HeroSkeleton />
            <SectionSkeleton titleWidth="w-48" count={4} />
            <SectionSkeleton titleWidth="w-32" count={4} />
          </>
        ) : (
          <>
            <HeroBanner />

            {sections.catalog.length > 0 && (
              <ProductSection
                title="Catálogo"
                products={sections.catalog}
                layout="grid"
                viewAllLink="/novidades"
              />
            )}
            
            {sections.newArrivals.length > 0 && (
              <ProductSection 
                title="Novidades" 
                products={sections.newArrivals} 
                layout="grid"
              />
            )}

            {sections.onSale.length > 0 && (
              <ProductSection 
                title="Promoções" 
                products={sections.onSale} 
                layout="grid"
                viewAllLink="/categoria/ofertas"
              />
            )}


          </>
        )}

        <WhatsAppBanner />
      </div>
    </PageWrapper>
  );
}


