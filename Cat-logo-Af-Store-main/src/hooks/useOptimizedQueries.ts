import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { configService } from '../services/configService';
import { Product } from '../types';

// Keys
export const QUERY_KEYS = {
  products: ['products'] as const,
  activeProducts: ['products', 'active'] as const,
  infiniteActiveProducts: (limit: number) => ['products', 'active', 'infinite', limit] as const,
  newArrivals: ['products', 'new'] as const,
  productsByCategory: (category: string) => ['products', 'category', category] as const,
  infiniteProductsByCategory: (category: string, limit: number) =>
    ['products', 'category', 'infinite', category, limit] as const,
  product: (id: string) => ['product', id] as const,
  config: ['config'] as const,
  search: (query: string) => ['products', 'search', query] as const,
};

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_STALE_TIME = 1000 * 60 * 10; // 10 minutos

// Hooks
export const useProducts = (page = 0, limit = 20) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, { page, limit }],
    queryFn: () => productService.getProducts(page, limit),
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
    retry: 2,
  });
};

export const useInfiniteActiveProducts = (limit = DEFAULT_PAGE_SIZE, enabled = true) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.infiniteActiveProducts(limit),
    queryFn: ({ pageParam = 0 }) => productService.getActiveProducts(pageParam, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    retry: 2,
  });
};


export const useInfiniteProductsByCategory = (category: string, limit = DEFAULT_PAGE_SIZE) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.infiniteProductsByCategory(category, limit),
    queryFn: ({ pageParam = 0 }) => productService.getProductsByCategory(category, pageParam, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined;
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};

export const useActiveProducts = (page = 0, limit = DEFAULT_PAGE_SIZE) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.activeProducts, { page, limit }],
    queryFn: () => productService.getActiveProducts(page, limit),
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
    retry: 2,
  });
};

export const useNewArrivals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.newArrivals,
    queryFn: () => productService.getNewArrivals(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProductsByCategory = (category: string, page = 0, limit = DEFAULT_PAGE_SIZE) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.productsByCategory(category), { page, limit }],
    queryFn: () => productService.getProductsByCategory(category, page, limit),
    enabled: !!category,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
    retry: 2,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache product details longer
    retry: 2,
  });
};

export const useConfig = () => {
  return useQuery({
    queryKey: QUERY_KEYS.config,
    queryFn: () => configService.getConfig(),
    staleTime: 1000 * 60 * 60, // Config rarely changes, cache for 1 hour
  });
};

export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => productService.searchProducts(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Mutations
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (product: Partial<Product>) => productService.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      productService.updateProduct(id, product),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product(variables.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      productService.toggleProductActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });

  return {
    createProduct: createMutation,
    updateProduct: updateMutation,
    deleteProduct: deleteMutation,
    toggleActive: toggleActiveMutation,
  };
};

export const prefetchCategory = (queryClient: any, slug: string) => {
  if (!slug) return;
  queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.productsByCategory(slug),
    queryFn: () => productService.getProductsByCategory(slug, 0, 8),
    staleTime: 1000 * 60 * 5,
  });
};



