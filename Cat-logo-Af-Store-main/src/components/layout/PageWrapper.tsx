import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(media.matches);

    const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
    } else {
      media.addListener(onChange);
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', onChange);
      } else {
        media.removeListener(onChange);
      }
    };
  }, []);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1 }}
      exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.08, ease: 'linear' }}
      className="pb-20"
    >
      {children}
    </motion.div>
  );
}
