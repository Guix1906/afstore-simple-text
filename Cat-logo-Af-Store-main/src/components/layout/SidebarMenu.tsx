import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { name: 'Lançamentos', to: '/novidades' },
  { name: 'Feminino', to: '/categoria/feminino' },
  { name: 'Masculino', to: '/categoria/masculino' },
  { name: 'Outlet', to: '/categoria/ofertas' },
];

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-brand-bg border-r border-white/5 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-4 h-16 flex items-center justify-between border-b border-white/5">
              <h2 className="text-[12px] font-sans font-black text-brand-gold uppercase tracking-[0.2em]">Explore</h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-8">
              <ul className="space-y-1">
                {MENU_ITEMS.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="w-full px-8 py-5 flex items-center justify-between active:bg-white/5 transition-colors text-left group"
                    >
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 group-active:text-brand-gold">
                        {item.name}
                      </span>
                      <ChevronRight size={16} className="text-white/20 group-active:text-brand-gold" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-10 border-t border-white/5 flex flex-col items-center">
              <div className="flex flex-col items-center opacity-80">
                <img
                  src="/af-logo.png"
                  alt="AF Store"
                  className="h-16 w-auto object-contain invert brightness-200"
                />
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white mt-1">
                  Performance Wear
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

