import { memo } from 'react';
import { Home, Grid, Sparkles, MessageCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useConfig } from '../../hooks/useOptimizedQueries';

const navItems = [
  { to: '/', icon: Home, label: 'Início', end: true },
  { to: '/categorias', icon: Grid, label: 'Categorias', end: false },
  { to: '/novidades', icon: Sparkles, label: 'Novidades', end: false },
];

const BottomNav = memo(function BottomNav() {
  const { data: config } = useConfig();
  const whatsappUrl = config ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}` : '';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-brand-bg/98 border-t border-brand-border/30 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-all px-4 active:scale-90 ${
                isActive ? 'text-brand-gold' : 'text-brand-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-sans font-extrabold uppercase tracking-[0.15em]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 text-brand-whatsapp px-4 active:scale-90 transition-transform"
          aria-label="WhatsApp"
        >
          <div className="bg-brand-whatsapp/10 p-1.5 rounded-full">
            <MessageCircle size={20} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-[9px] font-sans font-extrabold uppercase tracking-[0.15em]">Especialista</span>
        </a>
      </div>
    </nav>
  );
});

export default BottomNav;

