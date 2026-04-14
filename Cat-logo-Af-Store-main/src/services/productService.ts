import { supabase } from '../integrations/supabase/client';
import { Product } from '../types';
import localProducts from '../data/products.json';

const PAGE_SIZE_FALLBACK = 12;
const DB_PAGE_SIZE = 24;
const ACTIVE_PRODUCTS_CACHE_KEY = 'af-cache:active-products';
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

const safeStorage = {
  get(key: string) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // noop
    }
  },
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
  images: Array.isArray(p.images)
    ? p.images
        .map((img: unknown) => String(img || '').trim())
        .filter((img: string) => img.length > 0)
    : [],
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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 3500): Promise<T> => {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

const executeWithRetry = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 0
) => {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data, error } = await withTimeout(queryFn());

      if (!error && data) return { data, error: null };
      lastError = error || new Error('Empty response');
    } catch (error) {
      lastError = error;
    }
  }

  return { data: null as T | null, error: lastError };
};

const isAbortedRequest = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return message.includes('aborted') || code.includes('aborted');
};

const getCachedActiveProducts = () => {
  const cached = safeStorage.get(ACTIVE_PRODUCTS_CACHE_KEY);
  return Array.isArray(cached) ? cached.map(mapProduct) : [];
};

const sortByNewest = (items: Product[]) =>
  [...items].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));

const mergeById = (primary: Product[], secondary: Product[]) => {
  const merged = new Map<string, Product>();

  [...primary, ...secondary].forEach((item) => {
    if (!item?.id) return;
    const current = merged.get(item.id);
    if (!current) {
      merged.set(item.id, item);
      return;
    }

    merged.set(item.id, {
      ...current,
      ...item,
      images: item.images?.length ? item.images : current.images,
      sizes: item.sizes?.length ? item.sizes : current.sizes,
      tags: item.tags?.length ? item.tags : current.tags,
      description: item.description || current.description,
      measurements: item.measurements || current.measurements,
    });
  });

  return sortByNewest(Array.from(merged.values()));
};

const setCachedActiveProducts = (items: Product[], mode: 'merge' | 'replace' = 'replace') => {
  const activeOnly = items.filter((p) => p.active);
  const current = getCachedActiveProducts();
  const next = mode === 'merge' ? mergeById(activeOnly, current) : sortByNewest(activeOnly);
  safeStorage.set(ACTIVE_PRODUCTS_CACHE_KEY, next);
  return next;
};

const getFallbackActiveCatalog = () => {
  const cached = getCachedActiveProducts();
  const local = getLocalActiveProducts();
  return mergeById(cached, local);
};

const getLocalActiveProducts = () =>
  (localProducts as any[])
    .map(mapProduct)
    .filter((p) => p.active)
    .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));

export const productService = {
  async getAllActiveProducts(): Promise<Product[]> {
    const { data, error } = await executeWithRetry<any[]>(() =>
      supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(200)
    );

    if (!error && data && data.length > 0) {
      const mapped = data.map(mapProduct);
      setCachedActiveProducts(mapped, 'replace');
      return mapped;
    }

    if (isAbortedRequest(error)) {
      return [];
    }

    return getFallbackActiveCatalog();
  },

  async getActiveProducts(page = 0, limit = PAGE_SIZE_FALLBACK): Promise<Product[]> {
    const { safePage, safeLimit } = normalizePagination(page, limit);
    const from = safePage * safeLimit;
    const to = from + safeLimit - 1;

    const { data, error } = await executeWithRetry<any[]>(() =>
      supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .range(from, to)
    );

    if (!error && data && data.length > 0) {
      const mapped = data.map(mapProduct);
      setCachedActiveProducts(mapped, 'merge');
      return mapped;
    }

    if (isAbortedRequest(error)) {
      return [];
    }

    return paginate(getFallbackActiveCatalog(), safePage, safeLimit);
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
      const mapped = mergeById(getFallbackActiveCatalog(), (localProducts as any[]).map(mapProduct));
      return paginate(mapped, safePage, safeLimit);
    }

    const mapped = data.map(mapProduct);
    setCachedActiveProducts(mapped, 'merge');
    return mapped;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (String(id).startsWith('local-')) {
      const fallbackCatalog = mergeById(getFallbackActiveCatalog(), (localProducts as any[]).map(mapProduct));
      return fallbackCatalog.find((p) => p.id === String(id));
    }

    const { data, error } = await executeWithRetry<any>(() =>
      supabase.from('products').select(PRODUCT_DETAIL_FIELDS).eq('id', id).maybeSingle()
    );

    if (isAbortedRequest(error)) {
      return undefined;
    }

    if (error || !data) {
      const mapped = mergeById(getFallbackActiveCatalog(), (localProducts as any[]).map(mapProduct));
      return mapped.find((p) => p.id === String(id));
    }

    const mapped = mapProduct(data);
    setCachedActiveProducts([mapped], 'merge');
    return mapped;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const payload = sanitizePayload({
      ...product,
      slug: product.slug?.trim() || buildSlug(product.name),
    });
    const { data, error } = await supabase.from('products').insert(payload).select('*').single();
    if (error) throw error;
    const mapped = mapProduct(data);
    setCachedActiveProducts([mapped], 'merge');
    return mapped;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const payload = sanitizePayload({
      ...product,
      slug: product.slug?.trim() || (product.name ? buildSlug(product.name, id) : undefined),
    });
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    const mapped = mapProduct(data);
    setCachedActiveProducts([mapped], 'merge');
    return mapped;
  },


  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    const current = getCachedActiveProducts().filter((p) => p.id !== id);
    safeStorage.set(ACTIVE_PRODUCTS_CACHE_KEY, current);
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
      const mapped = mergeById(getFallbackActiveCatalog(), (localProducts as any[]).map(mapProduct))
        .filter((p) => p.active && p.category === category);

      return paginate(mapped, safePage, safeLimit);
    }
    const mapped = data.map(mapProduct);
    setCachedActiveProducts(mapped, 'merge');
    return mapped;
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
      return getFallbackActiveCatalog();
    }

    const mapped = data.map(mapProduct);
    setCachedActiveProducts(mapped, 'merge');
    return mapped;
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
      return mergeById(getFallbackActiveCatalog(), (localProducts as any[]).map(mapProduct))
        .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    const mapped = data.map(mapProduct);
    setCachedActiveProducts(mapped, 'merge');
    return mapped;
  },

  async toggleProductActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ active }).eq('id', id);
    if (error) throw error;

    const current = getCachedActiveProducts();
    const exists = current.find((p) => p.id === id);

    if (!active) {
      safeStorage.set(
        ACTIVE_PRODUCTS_CACHE_KEY,
        current.filter((p) => p.id !== id)
      );
      return;
    }

    if (exists) {
      safeStorage.set(
        ACTIVE_PRODUCTS_CACHE_KEY,
        sortByNewest(current.map((p) => (p.id === id ? { ...p, active: true } : p)))
      );
    }
  },

};
