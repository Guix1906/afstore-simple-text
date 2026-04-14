import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useConfig, useProductMutations } from '../../hooks/useOptimizedQueries';
import { adminAuthService } from '../../services/adminAuthService';
import { configService } from '../../services/configService';
import { Plus, Edit2, Trash2, Settings, LogOut, ExternalLink, Package, MoreHorizontal, LayoutDashboard } from 'lucide-react';
import { useEffect } from 'react';
import { useAdminSession } from '../../hooks/useAdminSession';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');
  const heroImageInputRef = useRef<HTMLInputElement | null>(null);
  const { isReady, isAdmin } = useAdminSession();
  const isAdminReady = isReady && isAdmin;

  const { data: products = [], isLoading: isLoadingProducts } = useProducts(0, 500, isAdminReady);
  const { data: config, isLoading: isLoadingConfig, refetch: refetchConfig } = useConfig(isAdminReady);
  const { toggleActive, deleteProduct } = useProductMutations();

  useEffect(() => {
    if (!isReady) return;
    if (!isAdmin) navigate('/admin');
  }, [isAdmin, isReady, navigate]);

  const handleToggleProduct = async (product: any) => {
    setActionError('');
    try {
      await toggleActive.mutateAsync({ id: product.id, active: !product.active });
      toast.success(`Produto ${product.active ? 'pausado' : 'ativado'} com sucesso.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status.';
      setActionError(message);
      toast.error(message);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    const confirmed = window.confirm(`Deseja excluir o produto "${product.name}"?`);
    if (!confirmed) return;

    setActionError('');
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success('Produto excluído com sucesso.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir produto.';
      setActionError(message);
      toast.error(message);
    }
  };

  const handleEditWhatsApp = async () => {
    if (!config) return;

    const whatsappNumber = window.prompt('Informe o WhatsApp de vendas:', config.whatsappNumber);
    if (!whatsappNumber) return;

    const normalized = whatsappNumber.trim();
    if (!/^\d{10,15}$/.test(normalized)) {
      setActionError('Número inválido.');
      return;
    }

    try {
      await configService.updateConfig({ ...config, whatsappNumber: normalized });
      refetchConfig();
      toast.success('WhatsApp atualizado com sucesso.');
    } catch (err) {
      setActionError('Erro ao atualizar WhatsApp.');
      toast.error('Erro ao atualizar WhatsApp.');
    }
  };

  const handleHeroImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    try {
      const heroImageUrls = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error('Falha ao ler imagens.'));
              reader.readAsDataURL(file);
            })
        )
      );

      await configService.updateConfig({
        ...config,
        heroImageUrl: heroImageUrls[0],
        heroImageUrls: [...(config.heroImageUrls || []), ...heroImageUrls],
      });

      refetchConfig();
      toast.success('Banner atualizado com sucesso.');
    } catch (err) {
      setActionError('Erro ao atualizar imagens.');
      toast.error('Erro ao atualizar imagens.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    if (!config) return;
    if (!window.confirm('Remover imagem?')) return;

    try {
      const newUrls = (config.heroImageUrls || []).filter((_, i) => i !== indexToRemove);
      await configService.updateConfig({
        ...config,
        heroImageUrl: newUrls[0] || '',
        heroImageUrls: newUrls,
      });
      refetchConfig();
      toast.success('Imagem removida com sucesso.');
    } catch (err) {
      setActionError('Erro ao remover imagem.');
      toast.error('Erro ao remover imagem.');
    }
  };

  const handleLogout = async () => {
    await adminAuthService.signOut();
    navigate('/admin');
  };

  if (!isReady || !isAdminReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0A] text-[#E5E5E5]">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-[#0F0F0F] border-r border-white/5 hidden md:flex flex-col justify-between py-10 px-6 sticky top-0 h-screen">
        <div>
          <div className="mb-12">
            <h1 className="text-2xl font-serif font-black text-white italic">AF<span className="text-brand-gold">.</span></h1>
            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mt-1">Dashboard</p>
          </div>
          <nav className="space-y-4">
            <button className="w-full flex items-center gap-3 px-4 py-4 bg-brand-gold text-black rounded-2xl font-extrabold text-[11px] uppercase tracking-widest transition-all">
              <Package size={18} />
              Meu Catálogo
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/5 rounded-2xl text-brand-text-muted hover:text-white font-extrabold text-[11px] uppercase tracking-widest transition-all">
              <Settings size={18} />
              Ajustes
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all text-[11px] font-extrabold uppercase tracking-widest">
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto md:mx-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-6 py-6 bg-[#0F0F0F] border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center">
                 <LayoutDashboard className="text-black" size={16} />
             </div>
             <h1 className="text-sm font-serif font-bold italic text-white">AF Painel</h1>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-red-400">
            <LogOut size={18} />
          </button>
        </div>

        <div className="px-5 md:px-12 py-8 md:py-12 space-y-12">
          {isLoadingProducts || isLoadingConfig ? (
            <div className="space-y-10 animate-pulse">
               <div className="h-64 bg-white/5 rounded-3xl" />
               <div className="h-96 bg-white/5 rounded-3xl" />
            </div>
          ) : (
            <>
              {/* Marketing Tools Card */}
              <section className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-[0.03] blur-[100px] pointer-events-none" />
                
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-gold mb-8">Ferramentas de Venda</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Zap da Loja</span>
                    <button onClick={handleEditWhatsApp} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-2xl p-5 border border-white/5 transition-all text-left group">
                      <span className="text-lg font-serif italic text-white">{config?.whatsappNumber}</span>
                      <Edit2 size={16} className="text-brand-gold opacity-50 group-hover:opacity-100" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Banners em Exibição ({config?.heroImageUrls?.length || 0})</span>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                       {(config?.heroImageUrls || []).map((url, i) => (
                         <div key={i} className="relative min-w-[120px] h-16 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 group">
                            <img src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" />
                            <button onClick={() => handleRemoveImage(i)} className="absolute inset-0 bg-red-500/80 items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash2 size={14} className="text-white" />
                            </button>
                         </div>
                       ))}
                       <button 
                         onClick={() => heroImageInputRef.current?.click()}
                         className="min-w-[120px] h-16 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-1 text-brand-gold hover:bg-white/10"
                       >
                         <Plus size={16} />
                         <span className="text-[8px] font-bold uppercase tracking-widest">Add Foto</span>
                       </button>
                    </div>
                    <input ref={heroImageInputRef} type="file" multiple className="hidden" onChange={handleHeroImageChange} />
                  </div>
                </div>
              </section>

              {/* Inventory Management */}
              <section className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                   <div>
                     <h2 className="text-2xl font-serif italic text-white">Stock Digital</h2>
                     <p className="text-[10px] text-brand-text-muted uppercase tracking-widest mt-1">Gerencie seu catálogo de produtos</p>
                   </div>
                   <button 
                     onClick={() => navigate('/admin/produto/novo')}
                     className="bg-brand-gold text-black h-14 w-14 sm:w-auto sm:px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-brand-gold/10"
                   >
                     <Plus size={20} />
                     <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest">Novo</span>
                   </button>
                </div>

                {actionError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-medium">
                    {actionError}
                  </div>
                )}

                <div className="grid gap-4 pb-32">
                  {products.map((product) => (
                    <div key={product.id} className="bg-[#121212] border border-white/5 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-brand-gold/20 transition-all relative overflow-hidden group">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black border border-white/10 flex-shrink-0">
                            <img src={product.images[0]} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-115 ${!product.active ? 'grayscale opacity-30 shadow-none' : 'shadow-2xl shadow-brand-gold/10'}`} alt="" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="text-white font-serif font-bold italic text-base truncate">{product.name}</h3>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                               <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">{product.category}</span>
                               <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">R$ {product.price.toFixed(2)}</span>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => navigate(`/admin/produto/editar/${product.id}`)}
                             className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={() => navigate(`/produto/${product.id}`)}
                             className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#888] hover:text-white rounded-xl"
                           >
                             <ExternalLink size={16} />
                           </button>
                         </div>

                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggleProduct(product)}
                              disabled={toggleActive.isPending}
                              className={`h-11 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${product.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            >
                              {product.active ? 'Ativo' : 'Pausado'}
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product)}
                              disabled={deleteProduct.isPending}
                              className="w-11 h-11 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


