import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import ProductCard from '../components/product/ProductCard';
import { CATEGORIES } from '../constants';
import { useInfiniteActiveProducts, useInfiniteProductsByCategory } from '../hooks/useOptimizedQueries';
import { ChevronLeft, SlidersHorizontal, Plus } from 'lucide-react';
import { SectionSkeleton } from '../components/layout/Skeletons';
import { goBackOr } from '../utils/navigation';

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedSize, setSelectedSize] = useState('Todos');

  const isOffers = slug === 'ofertas';

  const { 
    data: activeData, 
    isLoading: isLoadingActive, 
    fetchNextPage: fetchNextActive, 
    hasNextPage: hasNextActive,
    isFetchingNextPage: isFetchingActive 
  } = useInfiniteActiveProducts(8, isOffers);

  const { 
    data: catData, 
    isLoading: isLoadingCat, 
    fetchNextPage: fetchNextCat, 
    hasNextPage: hasNextCat,
    isFetchingNextPage: isFetchingCat 
  } = useInfiniteProductsByCategory(isOffers ? '' : slug || '', 8);


  const isLoading = isOffers ? isLoadingActive : isLoadingCat;
  const isFetchingNextPage = isOffers ? isFetchingActive : isFetchingCat;
  const hasNextPage = isOffers ? hasNextActive : hasNextCat;
  const fetchNextPage = isOffers ? fetchNextActive : fetchNextCat;

  const products = useMemo(() => {
    const data = isOffers ? activeData : catData;
    if (!data) return [];
    
    let allProducts = data.pages.flat();
    if (isOffers) {
      allProducts = allProducts.filter(p => p.isOnSale);
    }
    return allProducts;
  }, [isOffers, activeData, catData]);

  const category = CATEGORIES.find(c => c.slug === slug);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedSize !== 'Todos') {
      result = result.filter(p => p.sizes.includes(selectedSize as any));
    }
    if (sortBy === 'price-asc') result = result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result = result.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [products, sortBy, selectedSize]);

  const sizes = ['Todos', 'P', 'M', 'G', 'GG'];

  return (
    <PageWrapper>
      <div className="sticky top-16 z-40 bg-brand-bg border-b border-white/5">
        <div className="px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => goBackOr(navigate, '/')} 
              className="w-10 h-10 flex items-center justify-center text-white bg-[#181818] border border-white/10 rounded-full active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-3xl font-serif font-bold text-brand-gold uppercase tracking-tight">
              {category?.name || (isOffers ? 'Ofertas' : 'Shop')}
            </h2>
          </div>
        </div>

        <div className="px-4 pb-5 flex gap-2 overflow-x-auto scrollbar-hide touch-pan-x">
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`
                px-5 py-2.5 rounded-full text-[9px] font-sans font-black uppercase tracking-[0.2em] border transition-all whitespace-nowrap
                ${selectedSize === size 
                  ? 'bg-brand-gold border-brand-gold text-black shadow-lg shadow-brand-gold/10' 
                  : 'bg-[#121212] border-white/5 text-brand-text-muted active:scale-95'}
              `}
            >
              {size === 'Todos' ? 'All Sizes' : `Size: ${size}`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8">
          <SectionSkeleton titleWidth="w-0" count={8} />
        </div>
      ) : (
        <>
          <div className="px-6 py-8 flex items-center justify-between border-b border-white/5 mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">
                {filteredProducts.length} Peças
              </span>
              <span className="text-[8px] font-sans font-bold text-brand-gold uppercase tracking-[0.1em]">Coleção Ativa</span>
            </div>
            
            <div className="flex items-center gap-3 bg-[#121212] px-4 py-2 rounded-full border border-white/5">
              <SlidersHorizontal size={12} className="text-brand-gold" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none text-[9px] font-sans font-black uppercase tracking-[0.1em] text-white cursor-pointer"
              >
                <option value="relevance">Destaques</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
                <option value="newest">Lançamentos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 pb-12">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pb-24 px-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full max-w-xs py-5 flex items-center justify-center gap-2 bg-[#121212] border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-white active:scale-95 transition-all shadow-xl"
              >
                {isFetchingNextPage ? (
                  <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={14} className="text-brand-gold" />
                    Carregar Mais
                  </>
                )}
              </button>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="py-24 text-center space-y-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                 <SlidersHorizontal size={32} className="text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted">Nenhum item encontrado.</p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Ver Tudo
              </button>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}



