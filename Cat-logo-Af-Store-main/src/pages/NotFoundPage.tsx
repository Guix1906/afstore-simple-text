import { Link } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center gap-6">
        <span className="text-[10px] font-sans font-extrabold uppercase tracking-[0.3em] text-brand-gold">404</span>
        <h1 className="text-4xl font-serif font-bold text-brand-text uppercase tracking-tight">Página não encontrada</h1>
        <p className="text-sm text-brand-text-muted max-w-md">
          Este link não existe mais ou foi movido. Volte para a vitrine principal.
        </p>
        <Link to="/" className="btn-primary">
          Ir para início
        </Link>
      </div>
    </PageWrapper>
  );
}
