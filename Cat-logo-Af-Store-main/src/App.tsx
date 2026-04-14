import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import SidebarMenu from './components/layout/SidebarMenu';
import FloatingWhatsApp from './components/layout/FloatingWhatsApp';

// Lazy loading pages for performance
const Home = lazy(() => import('./pages/Home'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
  </div>
);

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<PageFallback />}><Home /></Suspense>} />
      <Route path="/categoria/:slug" element={<Suspense fallback={<PageFallback />}><CategoryPage /></Suspense>} />
      <Route path="/categoria" element={<Navigate to="/categorias" replace />} />
      <Route path="/produto/:id" element={<Suspense fallback={<PageFallback />}><ProductPage /></Suspense>} />
      <Route path="/busca" element={<Suspense fallback={<PageFallback />}><SearchPage /></Suspense>} />
      <Route path="/novidades" element={<Suspense fallback={<PageFallback />}><NewArrivalsPage /></Suspense>} />
      <Route path="/categorias" element={<Suspense fallback={<PageFallback />}><CategoriesPage /></Suspense>} />
      {/* Admin Routes */}
      <Route path="/admin" element={<Suspense fallback={<PageFallback />}><AdminLogin /></Suspense>} />
      <Route path="/admin/dashboard" element={<Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense>} />
      <Route path="/admin/produto/novo" element={<Suspense fallback={<PageFallback />}><AdminProductForm /></Suspense>} />
      <Route path="/admin/produto/editar/:id" element={<Suspense fallback={<PageFallback />}><AdminProductForm /></Suspense>} />
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense>} />
    </Routes>
  );
}


export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const prefetchCorePages = () => {
      void import('./pages/CategoriesPage');
      void import('./pages/SearchPage');
      void import('./pages/NewArrivalsPage');
      void import('./pages/admin/AdminLogin');
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(prefetchCorePages);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(prefetchCorePages, 600);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Garante que o loader suma mesmo se houver erro ou delay no mount
    const hideLoader = () => {
      const loader = document.getElementById('global-loader');
      if (loader) loader.classList.add('loader-hidden');
    };

    // Tenta esconder após 300ms do mount do React
    const timeout = setTimeout(hideLoader, 300);

    // Como segurança extra para iPhones Pro Max e Safari: 
    // Garante que se o window já carregou, o loader morre
    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('load', hideLoader);
    };
  }, []);

  // We check if we are in an admin route to hide common layout elements
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Header onMenuOpen={() => setIsMenuOpen(true)} />} />
        </Routes>
        
        <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        
        <main className="flex-1">
          <AnimatedRoutes />
        </main>

        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="/produto/:id" element={null} />
          <Route path="*" element={<FloatingWhatsApp />} />
        </Routes>

        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<BottomNav />} />
        </Routes>
      </div>
    </Router>
  );
}
