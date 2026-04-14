import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(media.matches);

    const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
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
