/**
 * Otimiza URLs de imagens do Supabase para reduzir consumo de banda e melhorar LCP.
 * Adiciona parâmetros de largura e formato WebP automaticamente.
 */
export const getOptimizedImage = (url: string, width = 600) => {
  if (!url) return '';
  
  // Se for uma imagem do Supabase (contém storage/v1/object/public)
  if (url.includes('supabase.co') && url.includes('storage/v1/object/public')) {
    // Adiciona parâmetros de transformação do Supabase
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&format=webp&quality=80`;
  }
  
  return url;
};
