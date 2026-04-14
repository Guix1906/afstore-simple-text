import PageWrapper from '../components/layout/PageWrapper';
import { CATEGORIES } from '../constants';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <PageWrapper>
      <div className="p-4 space-y-6">
        <h2 className="text-2xl font-serif font-bold text-brand-gold">Categorias</h2>
        
        <div className="grid gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/categoria/${cat.slug}`}
              className="flex items-center justify-between p-6 bg-brand-card border border-brand-border rounded-2xl group hover:border-brand-gold transition-colors"
            >
              <div className="flex items-center gap-4">
                {cat.icon && <span className="text-3xl">{cat.icon}</span>}
                <span className="font-bold uppercase tracking-widest text-sm text-brand-text group-hover:text-brand-gold transition-colors">
                  {cat.name}
                </span>
              </div>
              <ChevronRight size={20} className="text-brand-text-muted group-hover:text-brand-gold transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
