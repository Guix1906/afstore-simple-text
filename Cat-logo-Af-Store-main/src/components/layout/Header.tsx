import { memo } from 'react';
import { Search, Menu, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const prefetchPage = (path: string) => {
  if (path === '/busca') {
    void import('../../pages/SearchPage');
    return;
  }

  if (path === '/admin') {
    void import('../../pages/admin/AdminLogin');
  }
};

interface HeaderProps {
  onMenuOpen: () => void;
}

const Header = memo(function Header({ onMenuOpen }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/98 border-b border-brand-border/30 px-6 pt-[env(safe-area-inset-top)] min-h-[calc(4rem+env(safe-area-inset-top))] flex items-center justify-between transition-all duration-300">
      <button 
        onClick={onMenuOpen}
        className="p-2 -ml-2 text-brand-text-muted hover:text-brand-gold transition-colors active:scale-90"
      >
        <Menu size={20} />
      </button>

      <Link to="/" className="flex-1 flex justify-center active:opacity-70 transition-opacity">
        <img
          src="/af-logo.png"
          alt="AF Store"
          className="h-10 w-auto object-contain"
        />
      </Link>

      <div className="flex items-center gap-1 -mr-2">
        <button 
          onClick={() => navigate('/busca')}
          onMouseEnter={() => prefetchPage('/busca')}
          onTouchStart={() => prefetchPage('/busca')}
          className="p-2 text-brand-text-muted hover:text-brand-gold transition-colors active:scale-95"
          aria-label="Buscar"
        >
          <Search size={20} />
        </button>
        <button 
          onClick={() => navigate('/admin')}
          onMouseEnter={() => prefetchPage('/admin')}
          onTouchStart={() => prefetchPage('/admin')}
          className="p-2 text-brand-text-muted hover:text-brand-gold transition-colors active:scale-95"
          title="Acesso Restrito / Painel Admin"
          aria-label="Admin Login"
        >
          <User size={20} />
        </button>
      </div>
    </header>
  );
});

export default Header;
