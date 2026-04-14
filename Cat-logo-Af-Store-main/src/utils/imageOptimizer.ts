/**
 * Otimiza URLs de imagens do Supabase para reduzir consumo de banda e melhorar LCP.
 * Adiciona parâmetros de largura e formato WebP automaticamente.
 */
export const DEFAULT_IMAGE_FALLBACK = '/af-logo.jpeg';

const cleanImageUrl = (url: string) => String(url || '').trim();

export const getOptimizedImage = (url: string, width = 600) => {
  const normalizedUrl = cleanImageUrl(url);
  if (!normalizedUrl) return DEFAULT_IMAGE_FALLBACK;

  if (normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return normalizedUrl;
  }
  
  // Se for uma imagem do Supabase (contém storage/v1/object/public)
  if (
    normalizedUrl.includes('supabase.co') &&
    normalizedUrl.includes('storage/v1/object/public') &&
    !normalizedUrl.includes('width=')
  ) {
    // Adiciona parâmetros de transformação do Supabase
    const separator = normalizedUrl.includes('?') ? '&' : '?';
    return `${normalizedUrl}${separator}width=${width}&quality=80`;
  }
  
  return normalizedUrl;
};

export const getProductImageOrFallback = (images?: string[], width = 600) => {
  const firstImage = Array.isArray(images) ? images.find((img) => Boolean(String(img || '').trim())) : '';
  return getOptimizedImage(firstImage || DEFAULT_IMAGE_FALLBACK, width);
};
