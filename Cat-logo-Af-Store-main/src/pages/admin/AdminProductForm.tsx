import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { ChevronLeft, Save, UploadCloud, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAdminSession } from '../../hooks/useAdminSession';
import StableImage from '../../components/ui/StableImage';
import { DEFAULT_IMAGE_FALLBACK, getOptimizedImage } from '../../utils/imageOptimizer';
import { storageService } from '../../services/storageService';

const productSchema = z.object({
  name: z.string().trim().min(3, 'O nome do produto precisa ter pelo menos 3 caracteres.'),
  price: z.number().positive('O preço precisa ser maior que zero.'),
  description: z.string().trim().min(4, 'Preencha a descrição comercial.'),
  images: z.array(z.string()).min(1, 'Adicione pelo menos 1 imagem ao produto.'),
});

export default function AdminProductForm() {
  const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isReady, isAdmin } = useAdminSession();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'leggings',
    price: 0,
    description: '',
    sizes: ['P', 'M', 'G', 'GG'],
    images: [],
    active: true,
    isBestSeller: false,
    isNew: true,
    isOnSale: false,
    gender: 'feminino',
    tags: []
  });

  useEffect(() => {
    const loadProduct = async () => {
      if (!isReady) return;

      if (!isAdmin) {
        navigate('/admin');
        return;
      }
      
      if (id) {
        try {
          const p = await productService.getProductById(id);
          if (p) setFormData(p);
        } catch(e) {
          setError("Erro ao encontrar este produto.");
        }
      }
      setLoading(false);
    };
    void loadProduct();
  }, [id, isAdmin, isReady, navigate]);

  const parsedForm = useMemo(
    () =>
      productSchema.safeParse({
        name: formData.name ?? '',
        price: Number(formData.price || 0),
        description: formData.description ?? '',
        images: formData.images ?? [],
      }),
    [formData.description, formData.images, formData.name, formData.price]
  );

  const categoryOptions = useMemo(() => {
    const base = CATEGORIES.map((c) => c.slug);
    const current = (formData.category || '').trim();

    if (current && !base.includes(current)) {
      base.push(current);
    }

    return base;
  }, [formData.category]);

  const saveProduct = useCallback(async () => {
    if (!parsedForm.success) {
      const firstError = parsedForm.error.issues[0]?.message || 'Revise os campos obrigatórios.';
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setError('');
    setSaving(true);

    try {
      if (id) {
        await productService.updateProduct(id, formData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await productService.createProduct(formData);
        toast.success('Produto criado com sucesso!');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar produto.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [formData, id, navigate, parsedForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProduct();
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, index) => index !== indexToRemove),
    }));
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_IMAGE_SIZE_BYTES);
    if (!validFiles.length) {
      const message = 'Use imagens PNG/JPG/WEBP de até 6MB.';
      setError(message);
      toast.error(message);
      return;
    }

    if (validFiles.length !== files.length) {
      toast.error('Algumas imagens foram ignoradas por formato/tamanho inválido.');
    }
    
    setError('');
    setIsUploadingImage(true);
    try {
      const uploadedUrls = await storageService.uploadProductImages(validFiles);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
      toast.success('Imagens adicionadas com sucesso.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar imagem. Tente outra foto.';
      setError(message);
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddCategory = () => {
    const normalized = customCategory.trim().toLowerCase();
    if (!normalized) return;
    if (normalized.length < 3) {
      toast.error('Categoria deve ter pelo menos 3 caracteres.');
      return;
    }

    setFormData((prev) => ({ ...prev, category: normalized }));
    setCustomCategory('');
    toast.success('Categoria aplicada ao produto.');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const toggleSize = (size: string) => {
    setFormData(prev => {
      const s = prev.sizes || [];
      return { ...prev, sizes: s.includes(size) ? s.filter(x => x !== size) : [...s, size] };
    });
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] animate-pulse">
        <header className="px-6 h-20 bg-[#0F0F0F] border-b border-white/5 flex items-center justify-between">
          <div className="h-10 w-48 bg-[#181818] rounded-full" />
          <div className="h-10 w-32 bg-[#181818] rounded-xl" />
        </header>
        <main className="max-w-4xl mx-auto px-6 pt-10 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-[600px] bg-[#181818] rounded-3xl" />
          <div className="h-[400px] bg-[#181818] rounded-3xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E5E5E5] font-sans pb-24">
      <header className="sticky top-0 z-50 px-4 md:px-6 h-20 flex items-center justify-between bg-[#0F0F0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="w-10 h-10 flex items-center justify-center text-[#888] hover:text-white bg-[#181818] border border-white/5 hover:border-white/20 rounded-full transition-all">
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-serif italic text-base md:text-lg truncate">{id ? 'Editar Peça' : 'Nova Peça'}</h1>
            <p className="text-[8px] md:text-[9px] font-extrabold uppercase tracking-widest text-brand-gold">Antigravity Admin</p>
          </div>
        </div>
        
        <button 
          onClick={saveProduct}
          type="button"
          disabled={saving || isUploadingImage || !parsedForm.success}
          className="bg-brand-gold hover:bg-brand-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-[9px] md:text-[10px] uppercase tracking-wider px-4 md:px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-brand-gold/10"
        >
          <Save size={14} className="hidden sm:block" /> {saving ? '...' : 'Salvar'}
        </button>
      </header>


      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-8">
            <section className="bg-[#181818] border border-white/5 rounded-3xl p-8 space-y-6">
              <h2 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-4">Informações Essenciais</h2>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Nome da Peça</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-white/20"
                  placeholder="Ex: Legging Empina Bumbum Premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Preço Atual (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.price || ''}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-brand-gold outline-none transition-all placeholder:text-white/20"
                    placeholder="99.90"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Preço Antigo <span className="opacity-50">(R$, Opcional)</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.originalPrice || ''}
                    onChange={e => setFormData({...formData, originalPrice: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full bg-[#121212] border border-dashed border-white/10 rounded-xl px-4 py-4 text-sm text-[#888] focus:text-white focus:border-white/30 outline-none transition-all placeholder:text-white/20"
                    placeholder="129.90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-brand-gold outline-none appearance-none cursor-pointer"
                  >
                    {categoryOptions.map((slug) => (
                       <option key={slug} value={slug}>{slug}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Nova categoria"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-gold outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Gênero</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
                  >
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="unissex">Unissex</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Tamanhos Disponíveis</label>
                <div className="flex flex-wrap gap-3 p-4 bg-[#121212] rounded-xl border border-white/5">
                  {['P', 'M', 'G', 'GG', 'XG', 'Único'].map(sz => {
                    const selected = formData.sizes?.includes(sz);
                    return (
                      <button 
                        key={sz} 
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`w-10 h-10 rounded-md font-bold text-[10px] transition-all flex items-center justify-center ${selected ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20 scale-105' : 'bg-transparent text-[#888] hover:text-white border border-white/10 hover:border-white/30'}`}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="bg-[#181818] border border-white/5 rounded-3xl p-8 space-y-4">
               <h2 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-4">Apresentação</h2>
               
               <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Descrição Comercial</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={5}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-brand-gold outline-none resize-none leading-relaxed placeholder:text-white/20"
                  placeholder="Conte sobre o tecido, caimento, uso indicado..."
                />
              </div>
            </section>
          </div>

          {/* Right Column / Media */}
          <div className="space-y-8">
            
            <section className="bg-[#181818] border border-white/5 rounded-3xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-4">Fotos</h2>
               
               <div 
                  className={`w-full aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors text-center p-6 ${dragActive ? 'border-brand-gold bg-brand-gold/5' : 'border-white/10 hover:border-brand-gold/50 bg-[#121212]'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
               >
                 <UploadCloud size={32} className="text-[#888]" />
                 <div>
                   <p className="text-xs font-medium text-white">Arraste fotos aqui</p>
                   <p className="text-[9px] uppercase tracking-widest text-[#888] mt-1">ou</p>
                 </div>
                 <button 
                   type="button" 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-[10px] uppercase tracking-widest font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-white"
                 >
                   Procurar arquivo
                 </button>
                 <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileInput} className="hidden" />
               </div>

               {isUploadingImage && <p className="text-[10px] text-brand-gold animate-pulse text-center uppercase tracking-widest font-bold">Processando Fotos...</p>}

               {formData.images && formData.images.length > 0 && (
                 <div className="grid grid-cols-2 gap-3 mt-4">
                   {formData.images.map((img, i) => (
                     <div key={i} className="relative aspect-[3/4] bg-black border border-white/10 rounded-xl overflow-hidden group">
                         <StableImage
                           src={getOptimizedImage(img, 480)}
                           fallbackSrc={DEFAULT_IMAGE_FALLBACK}
                           showSkeleton={false}
                           alt="Pré-visualização da foto"
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           loading="lazy"
                           decoding="async"
                         />
                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                        {i === 0 && (
                           <div className="absolute top-2 left-2 bg-brand-gold text-black text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Capa</div>
                        )}
                        <button 
                          onClick={() => handleRemoveImage(i)}
                          className="absolute bottom-2 right-2 p-2 bg-white/10 hover:bg-red-500/80 backdrop-blur text-white rounded-full transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                     </div>
                   ))}
                 </div>
               )}
            </section>

            <section className="bg-[#181818] border border-white/5 rounded-3xl p-6 space-y-4">
               <h2 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-4">Tráfego & Destaques</h2>
               
               <div className="space-y-3">
                 <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${formData.active ? 'bg-green-500/5 border-green-500/20' : 'bg-transparent border-white/5 opacity-60'}`}>
                   <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 accent-green-500" />
                   <div>
                     <span className="block text-[11px] font-bold uppercase tracking-widest text-white">Ativo na Loja</span>
                     <span className="block text-[9px] text-[#888] mt-0.5">Visível para clientes</span>
                   </div>
                 </label>

                 <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${formData.isBestSeller ? 'bg-brand-gold/5 border-brand-gold/20' : 'bg-transparent border-white/5 opacity-60'}`}>
                   <input type="checkbox" checked={formData.isBestSeller} onChange={e => setFormData({...formData, isBestSeller: e.target.checked})} className="w-4 h-4 accent-brand-gold" />
                   <div>
                     <span className="block text-[11px] font-bold uppercase tracking-widest text-[#FFD700]">Mais Vendido</span>
                     <span className="block text-[9px] text-[#888] mt-0.5">Ganhe destaque no menu</span>
                   </div>
                 </label>

                 <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${formData.isNew ? 'bg-brand-gold/5 border-brand-gold/20' : 'bg-transparent border-white/5 opacity-60'}`}>
                   <input type="checkbox" checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})} className="w-4 h-4 accent-brand-gold" />
                   <div>
                     <span className="block text-[11px] font-bold uppercase tracking-widest text-brand-gold">Novidade</span>
                     <span className="block text-[9px] text-[#888] mt-0.5">Aparece na aba Novidades</span>
                   </div>
                 </label>

                 <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${formData.isOnSale ? 'bg-red-500/5 border-red-500/20' : 'bg-transparent border-white/5 opacity-60'}`}>
                   <input type="checkbox" checked={formData.isOnSale} onChange={e => setFormData({...formData, isOnSale: e.target.checked})} className="w-4 h-4 accent-red-500" />
                   <div>
                     <span className="block text-[11px] font-bold uppercase tracking-widest text-white">Oferta Extra</span>
                     <span className="block text-[9px] text-[#888] mt-0.5">Aparece na aba Promoções</span>
                   </div>
                 </label>
               </div>
            </section>

          </div>
        </div>

        {error && (
            <div className="mt-8 bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
              <span className="text-sm font-semibold text-red-400">{error}</span>
            </div>
        )}
      </main>
    </div>
  );
}
