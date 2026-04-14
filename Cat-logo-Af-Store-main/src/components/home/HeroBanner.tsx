import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../hooks/useOptimizedQueries';
import StableImage from '../ui/StableImage';
import { DEFAULT_IMAGE_FALLBACK, getOptimizedImage } from '../../utils/imageOptimizer';

const DEFAULT_SLIDES = [
  {
    id: 'd1',
    title: "Coleção — Serenity",
    subtitle: "Conforto e leveza para o seu dia",
    image: "/af-logo.jpeg",
    link: "/categoria/feminino"
  },
  {
    id: 'd2',
    title: "Linha — Violet",
    subtitle: "Estilo técnico com atitude",
    image: "/af-logo.jpeg",
    link: "/categoria/feminino"
  }
];

const HeroBanner = memo(function HeroBanner() {
  const navigate = useNavigate();
  const { data: config, isLoading } = useConfig();
  const [current, setCurrent] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const slides = useMemo(() => {
    if (!config) return DEFAULT_SLIDES;
    
    const urls = config.heroImageUrls?.length 
      ? config.heroImageUrls 
      : config.heroImageUrl 
        ? [config.heroImageUrl] 
        : [];

    if (urls.length === 0) return DEFAULT_SLIDES;

    return urls.map((url, index) => ({
      id: `hero-${index}`,
      title: index % 2 === 0 ? "Nova Coleção — Estilo" : "Alta — Performance",
      subtitle: index % 2 === 0 ? "Conforto em movimento" : "Tecnologia têxtil de ponta",
      image: getOptimizedImage(url, 1200),
      link: "/categorias"
    }));
  }, [config]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(media.matches);

    const onMotionChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    media.addEventListener('change', onMotionChange);

    if (media.matches) {
      return () => media.removeEventListener('change', onMotionChange);
    }

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => {
      media.removeEventListener('change', onMotionChange);
      clearInterval(timer);
    };
  }, [slides.length]);

  if (isLoading) {
    return (
      <div className="relative h-[65vh] w-full bg-brand-card/30 animate-pulse flex items-center justify-center rounded-b-[3rem] overflow-hidden">
        <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
      </div>
    );
  }

  const activeSlideIndex = current % slides.length;
  const activeSlide = slides[activeSlideIndex];
  const shouldPrioritizeImage = activeSlideIndex === 0;

  return (
    <div className="relative h-[65vh] w-full overflow-hidden bg-brand-bg rounded-b-[3rem]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-black/20 z-10" />
          <StableImage
            src={activeSlide.image}
            fallbackSrc={DEFAULT_IMAGE_FALLBACK}
            alt="Destaque"
            className="h-full w-full object-cover opacity-70"
            referrerPolicy="no-referrer"
            loading={shouldPrioritizeImage ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritizeImage ? 'high' : 'low'}
            decoding="async"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-20 px-6 text-center">
        <motion.div
          key={`content-${activeSlide.id}`}
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <h2 className="font-banner-display text-4xl md:text-6xl font-bold text-brand-text mb-2 leading-tight normal-case">
            {activeSlide.title.includes(' — ') ? (
              <>
                <span className="block">{activeSlide.title.split(' — ')[0]}</span>
                <span className="font-banner-support text-2xl md:text-3xl font-medium uppercase tracking-[0.2em] text-brand-gold">
                  {activeSlide.title.split(' — ')[1]}
                </span>
              </>
            ) : (
              activeSlide.title
            )}
          </h2>

          <p className="font-banner-support text-brand-text-muted text-[10px] uppercase tracking-[0.2em] mb-10">
            {activeSlide.subtitle}
          </p>

          <button
            onClick={() => navigate(activeSlide.link)}
            className="btn-primary flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            Ver Coleção
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === (current % slides.length) ? 'w-8 bg-brand-gold' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

export default HeroBanner;

