import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useConfig, useProductMutations } from '../../hooks/useOptimizedQueries';
import { configService } from '../../services/configService';
import { Plus, Edit2, Trash2, LogOut, ExternalLink, Package } from 'lucide-react';
import { toast } from 'sonner';
import StableImage from '../../components/ui/StableImage';
import { DEFAULT_IMAGE_FALLBACK, getOptimizedImage } from '../../utils/imageOptimizer';
import { storageService } from '../../services/storageService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');
  const heroImageInputRef = useRef<HTMLInputElement | null>(null);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(0, 500, true);
  const { data: config, isLoading: isLoadingConfig, refetch: refetchConfig } = useConfig(true);
  const { toggleActive, deleteProduct } = useProductMutations();

  const bannerUrls = (config?.heroImageUrls || []).slice(0, 2);
  const bannerLimitReached = bannerUrls.length >= 2;

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
    } catch {
      setActionError('Erro ao atualizar WhatsApp.');
      toast.error('Erro ao atualizar WhatsApp.');
    }
  };

  const handleHeroImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    try {
      const currentUrls = (config.heroImageUrls || []).slice(0, 2);
      const remainingSlots = 2 - currentUrls.length;

      if (remainingSlots <= 0) {
        toast.error('Limite de 2 banners atingido.');
        return;
      }

      const filesToUpload = files.slice(0, remainingSlots);
      if (filesToUpload.length < files.length) {
        toast.info('Somente 2 banners são permitidos no carrossel.');
      }

      const uploadedUrls = await storageService.uploadBannerImages(filesToUpload);
      const nextHeroUrls = [...currentUrls, ...uploadedUrls].slice(0, 2);

      await configService.updateConfig({
        ...config,
        heroImageUrl: nextHeroUrls[0] || '',
        heroImageUrls: nextHeroUrls,
      });

      refetchConfig();
      toast.success('Banner atualizado com sucesso.');
    } catch {
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
      const newUrls = (config.heroImageUrls || []).slice(0, 2).filter((_, i) => i !== indexToRemove);
      await configService.updateConfig({
        ...config,
        heroImageUrl: newUrls[0] || '',
        heroImageUrls: newUrls,
      });
      refetchConfig();
      toast.success('Imagem removida com sucesso.');
    } catch {
      setActionError('Erro ao remover imagem.');
      toast.error('Erro ao remover imagem.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10 space-y-8">
        <header className="rounded-2xl border border-brand-border bg-brand-card p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-muted">Painel Admin</p>
            <h1 className="mt-2 text-2xl font-serif italic text-brand-gold">Catálogo AF Store</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="h-11 rounded-xl border border-brand-border bg-brand-bg px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted hover:text-brand-text transition-colors"
            >
              Ver Loja
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="h-11 rounded-xl border border-brand-border bg-brand-bg px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted hover:text-brand-danger transition-colors flex items-center gap-2"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </header>

        {isLoadingProducts || isLoadingConfig ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-52 rounded-2xl bg-brand-card" />
            <div className="h-72 rounded-2xl bg-brand-card" />
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-brand-border bg-brand-card p-5 md:p-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-gold">Configurações</h2>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">WhatsApp da Loja</span>
                  <button
                    onClick={handleEditWhatsApp}
                    className="w-full flex items-center justify-between rounded-xl border border-brand-border bg-brand-bg p-4 text-left hover:border-brand-gold/50 transition-colors"
                  >
                    <span className="text-base font-serif italic text-brand-text">{config?.whatsappNumber}</span>
                    <Edit2 size={16} className="text-brand-gold" />
                  </button>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Banners do Carrossel ({bannerUrls.length}/2)</span>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {bannerUrls.map((url, i) => (
                      <div key={i} className="relative min-w-[120px] h-16 rounded-xl overflow-hidden bg-brand-bg border border-brand-border flex-shrink-0 group">
                        <StableImage
                          src={getOptimizedImage(url, 320)}
                          fallbackSrc={DEFAULT_IMAGE_FALLBACK}
                          showSkeleton={false}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all"
                          alt="Banner da loja"
                          loading="lazy"
                          decoding="async"
                        />
                        <button
                          onClick={() => handleRemoveImage(i)}
                          className="absolute inset-0 bg-brand-danger/80 items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => heroImageInputRef.current?.click()}
                      disabled={bannerLimitReached}
                      className="min-w-[120px] h-16 rounded-xl border border-dashed border-brand-border bg-brand-bg flex flex-col items-center justify-center gap-1 text-brand-gold hover:bg-brand-card disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      <span className="text-[8px] font-bold uppercase tracking-widest">Add Banner</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-brand-text-muted">Limite máximo: 2 banners no carrossel da Home.</p>
                  <input ref={heroImageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleHeroImageChange} />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif italic text-brand-text">Produtos</h2>
                  <p className="text-[10px] text-brand-text-muted uppercase tracking-[0.2em] mt-1">Cadastro e gestão do catálogo</p>
                </div>
                <button
                  onClick={() => navigate('/admin/produto/novo')}
                  className="bg-brand-gold text-brand-primary-foreground h-12 w-12 sm:w-auto sm:px-5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.2em]">Novo Produto</span>
                </button>
              </div>

              {actionError && (
                <div className="bg-brand-danger/10 border border-brand-danger/20 p-3 rounded-xl text-brand-danger text-xs font-medium">
                  {actionError}
                </div>
              )}

              <div className="grid gap-3 pb-20">
                {products.map((product) => (
                  <div key={product.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-gold/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-bg border border-brand-border flex-shrink-0">
                        <StableImage
                          src={getOptimizedImage(product.images?.[0], 200)}
                          fallbackSrc={DEFAULT_IMAGE_FALLBACK}
                          showSkeleton={false}
                          className={`w-full h-full object-cover ${!product.active ? 'grayscale opacity-40' : ''}`}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-brand-text font-serif font-bold italic text-base truncate">{product.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold">{product.category}</span>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-muted">R$ {product.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-brand-border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/produto/editar/${product.id}`)}
                          className="w-10 h-10 flex items-center justify-center bg-brand-bg hover:bg-brand-card border border-brand-border text-brand-text rounded-xl"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/produto/${product.id}`)}
                          className="w-10 h-10 flex items-center justify-center bg-brand-bg hover:bg-brand-card border border-brand-border text-brand-text-muted hover:text-brand-text rounded-xl"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleProduct(product)}
                          disabled={toggleActive.isPending}
                          className={`h-10 px-3 rounded-xl text-[9px] font-black uppercase tracking-[0.18em] transition-all border ${product.active ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/30' : 'bg-brand-danger/10 text-brand-danger border-brand-danger/30'}`}
                        >
                          {product.active ? 'Ativo' : 'Pausado'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          disabled={deleteProduct.isPending}
                          className="w-10 h-10 flex items-center justify-center bg-brand-danger/10 hover:bg-brand-danger text-brand-danger hover:text-brand-text rounded-xl transition-all"
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
      </main>
    </div>
  );
}


