import { supabase } from '../integrations/supabase/client';
import { Product } from '../types';
import localProducts from '../data/products.json';

// Função ultra-segura de conversão
const mapProduct = (p: any): Product => ({
  id: String(p.id),
  name: String(p.name || 'Produto sem nome'),
  slug: String(p.slug || ''),
  category: (p.category || 'leggings') as any,
  price: Number(p.price || 0),
  originalPrice: p.original_price || p.originalPrice || undefined,
  discount: p.discount || undefined,
  images: Array.isArray(p.images) ? p.images : [],
  sizes: Array.isArray(p.sizes) ? p.sizes : ['P', 'M', 'G'],
  colors: Array.isArray(p.colors) ? p.colors : [],
  description: p.description || '',
  measurements: p.measurements || undefined,
  isNew: !!(p.is_new || p.isNew),
  isBestSeller: !!(p.is_best_seller || p.isBestSeller),
  isOnSale: !!(p.is_on_sale || p.isOnSale),
  active: p.active !== false,
  gender: (p.gender || 'feminino') as any,
  tags: Array.isArray(p.tags) ? p.tags : [],
  createdAt: p.created_at || p.createdAt || new Date().toISOString(),
});

const sanitizePayload = (p: Partial<Product>) => ({
  name: p.name,
  slug: p.slug,
  category: p.category,
  price: p.price,
  original_price: p.originalPrice,
  discount: p.discount,
  images: p.images,
  sizes: p.sizes,
  colors: p.colors,
  description: p.description,
  measurements: p.measurements,
  is_new: p.isNew,
  is_best_seller: p.isBestSeller,
  is_on_sale: p.isOnSale,
  active: p.active,
  gender: p.gender,
  tags: p.tags,
});

export const productService = {
  async getActiveProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return data.map(mapProduct);
      }
      
      // Fallback para local apenas se houver algo e o cloud falhar
      return (localProducts as any[]).map(mapProduct);
    } catch (err) {
      return (localProducts as any[]).map(mapProduct);
    }
  },

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      return (localProducts as any[]).map(mapProduct);
    }
    return data.map(mapProduct);
  },

  async getProductById(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      return (localProducts as any[]).find(p => p.id === id);
    }
    return mapProduct(data);
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const payload = sanitizePayload(product);
    const { data, error } = await supabase.from('products').insert(payload).select('*').single();
    if (error) throw error;
    return mapProduct(data);
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const payload = sanitizePayload(product);
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return mapProduct(data);
  },


  async deleteProduct(id: string): Promise<void> {
    await supabase.from('products').delete().eq('id', id);
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('active', true).eq('category', category);
    if (error || !data || data.length === 0) {
      return (localProducts as any[]).filter(p => p.category === category).map(mapProduct);
    }
    return data.map(mapProduct);
  },

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('is_new', true)
      .order('created_at', { ascending: false });
    
    if (error || !data || data.length === 0) {
      // Se não houver produtos marcados como novos no banco, retorna os mais recentes
      const { data: recentData } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return (recentData || []).map(mapProduct);
    }
    return data.map(mapProduct);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    const { data, error } = await supabase.from('products').select('*').eq('active', true).or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`);
    if (error || !data || data.length === 0) {
      return (localProducts as any[]).filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).map(mapProduct);
    }
    return data.map(mapProduct);
  },

  async toggleProductActive(id: string, active: boolean): Promise<void> {
    await supabase.from('products').update({ active }).eq('id', id);
  },

};
