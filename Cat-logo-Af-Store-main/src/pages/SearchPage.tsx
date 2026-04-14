import PageWrapper from '../components/layout/PageWrapper';

import ProductCard from '../components/product/ProductCard';
import SearchBar from '../components/ui/SearchBar';
import { CATEGORIES } from '../constants';
import { useActiveProducts, useSearchProducts } from '../hooks/useOptimizedQueries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { SectionSkeleton } from '../components/layout/Skeletons';

export default function SearchPage() {
  const { searchQuery } = useStore();
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  
  const { data: searchResults, isLoading: isLoadingSearch } = useSearchProducts(debouncedSearchQuery);
  const { data: activeProducts, isLoading: isLoadingHighlights } = useActiveProducts(0, 4);

  const highlights = activeProducts || [];
  const results = searchResults || [];

  return (
    <PageWrapper>
      <div className="p-4 space-y-6 pt-20">
        <SearchBar />

        {searchQuery.trim() ? (
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">
              {isLoadingSearch ? 'Buscando...' : `${results.length} Resultados para "${searchQuery}"`}
            </h2>
            
            {isLoadingSearch ? (
              <SectionSkeleton titleWidth="w-0" count={4} />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {results.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            
            {!isLoadingSearch && results.length === 0 && (
              <div className="py-20 text-center text-brand-text-muted">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">
                Sugestões de Categorias
              </h2>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/categoria/${cat.slug}`}
                    className="px-4 py-2 bg-brand-card border border-brand-border rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-brand-gold transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">
                Destaques
              </h2>
              {isLoadingHighlights ? (
                <SectionSkeleton titleWidth="w-0" count={4} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {highlights.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

