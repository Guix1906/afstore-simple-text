import React from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (location.pathname !== '/busca') {
      navigate('/busca');
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="O que você procura?"
        className="w-full bg-brand-card border border-brand-border rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-brand-gold transition-colors"
      />
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
