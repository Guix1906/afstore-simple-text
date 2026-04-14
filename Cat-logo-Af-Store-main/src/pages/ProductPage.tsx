import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, memo } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import ProductGallery from '../components/product/ProductGallery';
import SizeSelector from '../components/product/SizeSelector';
import ColorSelector from '../components/product/ColorSelector';
import WhatsAppButton from '../components/product/WhatsAppButton';
import ProductCard from '../components/product/ProductCard';
import PriceDisplay from '../components/ui/PriceDisplay';
import Badge from '../components/ui/Badge';
import { useProduct, useProductsByCategory } from '../hooks/useOptimizedQueries';
import { ChevronLeft, Ruler, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { goBackOr } from '../utils/navigation';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isMeasuresOpen, setIsMeasuresOpen] = useState(false);

  // Parallel fetching: use hinted category from router state if available
  const categoryHint = location.state?.category || '';

  const { data: product, isLoading: isLoadingProduct } = useProduct(id || '');
  
  // By using categoryHint, we break the waterfall and fetch in parallel
  const { data: categoryProducts } = useProductsByCategory(
    categoryHint || product?.category || '',
    0,
    10
  );

  const relatedProducts = useMemo(() => {
    if (!categoryProducts || !product) return [];
    return categoryProducts.filter((item) => item.id !== product.id).slice(0, 4);
  }, [categoryProducts, product]);

  if (isLoadingProduct || !product) {
    return (
      <PageWrapper>
        <div className="sticky top-0 z-50 px-4 h-20 flex items-center justify-between bg-brand-bg/95 border-b border-brand-border/50">
          <button onClick={() => goBackOr(navigate, '/')} className="w-10 h-10 flex items-center justify-center text-brand-text bg-brand-card/50 border border-brand-border rounded-full">
            <ChevronLeft size={20} />
          </button>
          <div className="w-32 h-4 bg-brand-card/50 rounded animate-pulse" />
          <div className="w-10" />
        </div>
        <div className="aspect-[4/5] bg-brand-card/30 animate-pulse w-full max-w-lg mx-auto" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Optimized Sticky Header */}
      <div className="sticky top-0 z-50 px-4 h-20 flex items-center justify-between bg-brand-bg/95 border-b border-white/5 backdrop-blur-md">
        <button 
          onClick={() => goBackOr(navigate, '/')} 
          className="w-10 h-10 flex items-center justify-center text-brand-text bg-[#181818] border border-white/10 rounded-full active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-sans font-extrabold uppercase tracking-[0.3em] text-brand-gold">Antigravity Premium</span>
          <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-white truncate max-w-[150px]">
            {product.name}
          </h2>
        </div>
        <div className="w-10" />
      </div>

      <ProductGallery images={product.images} />

      <div className="p-8 space-y-10">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {product.isBestSeller && <Badge variant="gold">Performance Pick</Badge>}
            {product.isNew && <Badge variant="gold">Lançamento</Badge>}
          </div>
          <h1 className="text-4xl font-serif font-black text-brand-text leading-[1.1] uppercase tracking-tight">
            {product.name}
          </h1>
          <PriceDisplay 
            price={product.price} 
            originalPrice={product.originalPrice} 
            discount={product.discount}
            size="lg"
          />
        </div>

        <div className="space-y-6 bg-[#121212] p-6 rounded-[2.5rem] border border-white/5">
          {product.colors && (
            <ColorSelector 
              colors={product.colors} 
              selected={selectedColor} 
              onSelect={setSelectedColor} 
            />
          )}

          <SizeSelector 
            sizes={product.sizes} 
            selected={selectedSize} 
            onSelect={setSelectedSize} 
          />
        </div>

        <div className="space-y-3">
          <div className="bg-[#121212] rounded-3xl border border-white/5 overflow-hidden">
            <button 
              onClick={() => setIsDescOpen(!isDescOpen)}
              className="w-full px-6 py-6 flex items-center justify-between text-left active:bg-white/5 transition-colors"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">Especificações</span>
              <ChevronDown size={16} className={`text-brand-gold transition-transform duration-500 ${isDescOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isDescOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                >
                  <p className="px-6 pb-6 text-sm font-sans text-brand-text-muted leading-relaxed">
                    {product.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {product.measurements && (
            <div className="bg-[#121212] rounded-3xl border border-white/5 overflow-hidden">
              <button 
                onClick={() => setIsMeasuresOpen(!isMeasuresOpen)}
                className="w-full px-6 py-6 flex items-center justify-between text-left active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Ruler size={14} className="text-brand-gold" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">Guia de Fit</span>
                </div>
                <ChevronDown size={16} className={`text-brand-gold transition-transform duration-500 ${isMeasuresOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isMeasuresOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                  >
                    <div className="mx-6 mb-6 p-5 bg-black/40 rounded-2xl border border-white/5 text-xs font-sans text-brand-text-muted leading-loose whitespace-pre-line">
                      {product.measurements}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div className="pt-20 space-y-8 pb-32">
            <div className="flex flex-col gap-1 items-center mb-10">
              <span className="text-[9px] font-sans font-extrabold uppercase tracking-[0.4em] text-brand-gold">Match Perfeito</span>
              <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-tight">Complete o Look</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <WhatsAppButton 
        product={product} 
        selectedSize={selectedSize} 
        selectedColor={selectedColor} 
      />
    </PageWrapper>
  );
}


