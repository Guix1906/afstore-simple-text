import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../constants';

export default function CategoryScroll() {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-6 px-4">
      <div className="flex gap-6 min-w-max">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            to={`/categoria/${category.slug}`}
            className="flex flex-col items-center gap-2 group"
          >
            {category.icon && (
              <div className="w-16 h-16 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-2xl group-hover:border-brand-gold transition-colors">
                {category.icon}
              </div>
            )}
            <span className="text-[10px] font-medium uppercase tracking-widest text-brand-text-muted group-hover:text-brand-gold transition-colors">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
