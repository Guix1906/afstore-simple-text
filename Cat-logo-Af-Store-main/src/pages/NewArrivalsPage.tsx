import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import ProductCard from '../components/product/ProductCard';
import { useInfiniteActiveProducts } from '../hooks/useOptimizedQueries';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { SectionSkeleton } from '../components/layout/Skeletons';
import { goBackOr } from '../utils/navigation';

export default function NewArrivalsPage() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteActiveProducts(24);

  const displayProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flat();
  }, [data]);

  return (
    <PageWrapper>
      <div className="sticky top-16 z-40 bg-brand-bg border-b border-white/5">
        <div className="px-5 h-20 flex items-center gap-4">
          <button 
            onClick={() => goBackOr(navigate, '/')} 
            className="w-10 h-10 flex items-center justify-center text-white bg-[#181818] border border-white/10 rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[14px] font-sans font-black text-brand-gold uppercase tracking-[0.2em]">Novidades</h2>
            <span className="text-[8px] font-sans font-bold text-white/40 uppercase tracking-[0.1em]">Lançamentos AF</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 flex items-center justify-between border-b border-white/5 mb-8">
        <div className="flex items-center gap-2">
           <Sparkles size={14} className="text-brand-gold" />
           <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">
              {isLoading ? 'Carregando Coleção...' : `${displayProducts.length} Peças Carregadas`}
           </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 px-4 pb-24">
          <SectionSkeleton titleWidth="w-0" count={8} />
        </div>
      ) : (
        <>
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 pb-24">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasNextPage && (
              <div className="px-4 pb-24 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn-primary !px-8 disabled:opacity-60"
                >
                  {isFetchingNextPage ? 'Carregando mais...' : 'Carregar mais'}
                </button>
              </div>
            )}

            {!hasNextPage && displayProducts.length > 0 && isFetching && (
              <div className="px-4 pb-20 text-center">
                <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white/60">
                  Atualizando catálogo...
                </span>
              </div>
            )}
          ) : (
            <div className="py-24 text-center px-10 space-y-6">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                 <Sparkles size={32} className="text-white opacity-20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted">
                Novas peças chegando em breve.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary !px-8"
              >
                Explorar Loja
              </button>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
