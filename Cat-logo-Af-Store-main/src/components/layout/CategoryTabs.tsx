import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORIES } from '../../constants';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../hooks/useOptimizedQueries';
import { productService } from '../../services/productService';

const CategoryTabs = memo(function CategoryTabs() {
  const queryClient = useQueryClient();

  const tabs = [
    { name: 'Home', slug: 'home', path: '/' },
    { name: 'Novidades', slug: 'novidades', path: '/novidades' },
    ...CATEGORIES.map(c => ({ ...c, path: `/categoria/${c.slug}` })),
  ];


  const handlePrefetch = (slug: string) => {
    if (!slug) return;
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.productsByCategory(slug),
      queryFn: () => productService.getProductsByCategory(slug, 0, 8),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <div className="sticky top-16 z-40 bg-brand-bg border-b border-white/5">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-4 touch-pan-x">
        {tabs.map((tab) => (
          <NavLink
            key={tab.slug}
            to={tab.path}
            end={tab.path === '/'}
            onMouseEnter={() => handlePrefetch(tab.slug)}
            onTouchStart={() => handlePrefetch(tab.slug)}
            className={({ isActive }) => `
              px-6 py-2.5 rounded-full text-[9px] font-sans font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border
              ${isActive 
                ? 'bg-brand-gold border-brand-gold text-black shadow-lg shadow-brand-gold/10' 
                : 'bg-[#181818] border-white/5 text-brand-text-muted active:scale-95'}
            `}
          >
            {tab.name}
          </NavLink>
        ))}

      </div>
    </div>
  );
});


export default CategoryTabs;


