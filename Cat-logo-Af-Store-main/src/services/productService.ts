import { supabase } from '../integrations/supabase/client';
import { Product } from '../types';
import localProducts from '../data/products.json';

const PAGE_SIZE_FALLBACK = 12;
const DB_PAGE_SIZE = 24;
const PRODUCT_LIST_FIELDS = `
  id,
  name,
  slug,
  category,
  price,
  original_price,
  discount,
  images,
  is_new,
  is_best_seller,
  is_on_sale,
  active,
  created_at
`;

const PRODUCT_DETAIL_FIELDS = `
  id,
  name,
  slug,
  category,
  price,
  original_price,
  discount,
  images,
  sizes,
  colors,
  description,
  measurements,
  is_new,
  is_best_seller,
  is_on_sale,
  active,
  gender,
  tags,
  created_at
`;

const normalizePagination = (page = 0, limit = PAGE_SIZE_FALLBACK) => {
  const safePage = Number.isFinite(page) && page >= 0 ? Math.floor(page) : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : PAGE_SIZE_FALLBACK;
  return { safePage, safeLimit };
};

const paginate = <T,>(items: T[], page = 0, limit = PAGE_SIZE_FALLBACK) => {
  const { safePage, safeLimit } = normalizePagination(page, limit);
  const start = safePage * safeLimit;
  return items.slice(start, start + safeLimit);
};

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildSlug = (name?: string, fallbackId?: string) => {
  const base = toSlug(name || '') || 'produto';
  const suffix = (fallbackId || crypto.randomUUID()).slice(0, 8);
  return `${base}-${suffix}`;
};

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

const fetchProductsByIds = async (ids: string[]) => {
  if (!ids.length) return [] as Product[];

  const { data, error } = await executeWithRetry<any[]>(() =>
    supabase.from('products').select(PRODUCT_LIST_FIELDS).in('id', ids)
  );

  if (error || !data) return [];

  const mapById = new Map(data.map((item) => [String(item.id), mapProduct(item)]));
  return ids.map((id) => mapById.get(String(id))).filter(Boolean) as Product[];
};

const executeWithRetry = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 1
) => {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const { data, error } = await queryFn();

    if (!error && data) return { data, error: null };
    lastError = error;
  }

  return { data: null as T | null, error: lastError };
};

const isAbortedRequest = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return message.includes('aborted') || code.includes('aborted');
};

export const productService = {
  async getAllActiveProducts(): Promise<Product[]> {
    const pageSize = DB_PAGE_SIZE;
    let page = 0;
    const allProducts: Product[] = [];

    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: idRows, error } = await executeWithRetry<any[]>(() =>
        supabase
          .from('products')
          .select('id')
          .eq('active', true)
          .range(from, to)
      );

      if (error || !idRows) {
        if (isAbortedRequest(error)) {
          return allProducts;
        }
        return (localProducts as any[])
          .map(mapProduct)
          .filter((p) => p.active)
          .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
      }

      const ids = idRows.map((row) => String(row.id));
      const mapped = await fetchProductsByIds(ids);
      allProducts.push(...mapped);

      if (ids.length < pageSize) break;
      page += 1;
    }

    return allProducts;
  },

  async getActiveProducts(page = 0, limit = PAGE_SIZE_FALLBACK): Promise<Product[]> {
    const { safePage, safeLimit } = normalizePagination(page, limit);
    const from = safePage * safeLimit;
    const to = from + safeLimit - 1;

    try {
      const { data: idRows, error } = await executeWithRetry<any[]>(() =>
        supabase
          .from('products')
          .select('id')
          .eq('active', true)
          .range(from, to)
      );
      
      if (!error && idRows) {
        const ids = idRows.map((row) => String(row.id));
        return fetchProductsByIds(ids);
      }

      if (isAbortedRequest(error)) {
        return [];
      }
      
      // Fallback para local apenas se houver algo e o cloud falhar
      const mapped = (localProducts as any[])
        .map(mapProduct)
        .filter((p) => p.active);

      return paginate(mapped, safePage, safeLimit);
    } catch (err) {
      const mapped = (localProducts as any[])
        .map(mapProduct)
        .filter((p) => p.active);

      return paginate(mapped, safePage, safeLimit);
    }
  },

  async getProducts(page = 0, limit = PAGE_SIZE_FALLBACK): Promise<Product[]> {
    const { safePage, safeLimit } = normalizePagination(page, limit);
    const from = safePage * safeLimit;
    const to = from + safeLimit - 1;

    const { data, error } = await executeWithRetry<any[]>(() =>
      supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .range(from, to)
    );

    if (isAbortedRequest(error)) {
      return [];
    }

    if (error || !data || data.length === 0) {
      const mapped = (localProducts as any[]).map(mapProduct);
      return paginate(mapped, safePage, safeLimit);
    }
    return data.map(mapProduct);
  },

  async getProductById(id: string): Promise<Product | undefined> {
    const { data, error } = await executeWithRetry<any>(() =>
      supabase.from('products').select(PRODUCT_DETAIL_FIELDS).eq('id', id).maybeSingle()
    );

    if (isAbortedRequest(error)) {
      return undefined;
    }

    if (error || !data) {
      const mapped = (localProducts as any[]).map(mapProduct);
      return mapped.find((p) => p.id === String(id));
    }
    return mapProduct(data);
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const payload = sanitizePayload({
      ...product,
      slug: product.slug?.trim() || buildSlug(product.name),
    });
    const { data, error } = await supabase.from('products').insert(payload).select('*').single();
    if (error) throw error;
    return mapProduct(data);
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const payload = sanitizePayload({
      ...product,
      slug: product.slug?.trim() || (product.name ? buildSlug(product.name, id) : undefined),
    });
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return mapProduct(data);
  },


  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async getProductsByCategory(category: string, page = 0, limit = PAGE_SIZE_FALLBACK): Promise<Product[]> {
    const { safePage, safeLimit } = normalizePagination(page, limit);
    const from = safePage * safeLimit;
    const to = from + safeLimit - 1;

    const { data, error } = await executeWithRetry<any[]>(() =>
      supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .eq('active', true)
        .eq('category', category)
        .range(from, to)
    );

    if (isAbortedRequest(error)) {
      return [];
    }

    if (error || !data || data.length === 0) {
      const mapped = (localProducts as any[])
        .map(mapProduct)
        .filter((p) => p.active && p.category === category);

      return paginate(mapped, safePage, safeLimit);
    }

    return data.map(mapProduct);
  },

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await executeWithRetry<any[]>(() =>
      supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .eq('active', true)
        .eq('is_new', true)
        .limit(DB_PAGE_SIZE)
    );

    if (isAbortedRequest(error)) {
      return [];
    }
    
    if (error || !data || data.length === 0) {
      return (localProducts as any[])
        .map(mapProduct)
        .filter((p) => p.active)
        .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
    }
    return data.map(mapProduct);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    const { data, error } = await executeWithRetry<any[]>(() =>
      supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .eq('active', true)
        .or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`)
    );

    if (isAbortedRequest(error)) {
      return [];
    }
    if (error || !data || data.length === 0) {
      return (localProducts as any[]).filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).map(mapProduct);
    }
    return data.map(mapProduct);
  },

  async toggleProductActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ active }).eq('id', id);
    if (error) throw error;
  },

};
