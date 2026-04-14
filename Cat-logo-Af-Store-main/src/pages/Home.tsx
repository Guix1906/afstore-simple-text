import { useEffect, useMemo, useRef, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import HeroBanner from '../components/home/HeroBanner';
import CategoryTabs from '../components/layout/CategoryTabs';
import ProductSection from '../components/home/ProductSection';
import WhatsAppBanner from '../components/home/WhatsAppBanner';
import { useInfiniteActiveProducts, QUERY_KEYS } from '../hooks/useOptimizedQueries';
import { SectionSkeleton, HeroSkeleton } from '../components/layout/Skeletons';
import { useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';

export default function Home() {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 12
  );
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteActiveProducts(pageSize);

  useEffect(() => {
    const onResize = () => {
      setPageSize(window.innerWidth < 768 ? 8 : 12);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const products = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flat();
  }, [data]);

  const sections = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        newArrivals: [],
        onSale: [],
      };
    }
    
    return {
      newArrivals: products,
      onSale: products.filter(p => p.isOnSale).slice(0, 4)
    };
  }, [products]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '280px 0px', threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);


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

        {hasNextPage && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
        {isFetchingNextPage && <SectionSkeleton titleWidth="w-0" count={pageSize >= 12 ? 4 : 2} />}

        {hasNextPage && !isFetchingNextPage && (
          <div className="px-4 pb-2 flex justify-center">
            <button
              onClick={() => void fetchNextPage()}
              className="btn-primary"
            >
              Carregar mais produtos
            </button>
          </div>
        )}

        <WhatsAppBanner />
      </div>
    </PageWrapper>
  );
}


