/**
 * Otimiza URLs de imagens do Supabase para reduzir consumo de banda e melhorar LCP.
 * Adiciona parâmetros de largura e formato WebP automaticamente.
 */
export const DEFAULT_IMAGE_FALLBACK = '/image-placeholder.svg';
const IMAGE_QUALITY = 75;
const MOBILE_MAX_WIDTH = 800;
const TABLET_MAX_WIDTH = 1200;
const DESKTOP_MAX_WIDTH = 1600;

const cleanImageUrl = (url: string) => String(url || '').trim();

const normalizeAppHostedStaticUrl = (url: string) => {
  const normalized = cleanImageUrl(url);
  if (!normalized || normalized.startsWith('/') || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    const isLovableHost = parsed.hostname.includes('lovable.app');
    const isImagePath = /\.(jpe?g|png|webp|avif|svg)(\?.*)?$/i.test(`${parsed.pathname}${parsed.search}`);

    if (isLovableHost && isImagePath) {
      return `${parsed.pathname}${parsed.search}`;
    }

    return normalized;
  } catch {
    return normalized;
  }
};

export const withImageVersion = (url: string, version?: string | number) => {
  const normalizedUrl = normalizeAppHostedStaticUrl(url);
  if (!normalizedUrl || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) return normalizedUrl;

  const versionValue = String(version ?? '').trim();
  if (!versionValue) return normalizedUrl;

  try {
    if (normalizedUrl.startsWith('/')) {
      const [pathname, search = ''] = normalizedUrl.split('?');
      const params = new URLSearchParams(search);
      if (!params.get('updatedAt')) params.set('updatedAt', versionValue);
      const nextSearch = params.toString();
      return nextSearch ? `${pathname}?${nextSearch}` : pathname;
    }

    const parsed = new URL(
      normalizedUrl,
      typeof window !== 'undefined' ? window.location.origin : 'https://localhost'
    );

    if (!parsed.searchParams.get('updatedAt')) {
      parsed.searchParams.set('updatedAt', versionValue);
    }

    return parsed.toString();
  } catch {
    const separator = normalizedUrl.includes('?') ? '&' : '?';
    return normalizedUrl.includes('updatedAt=')
      ? normalizedUrl
      : `${normalizedUrl}${separator}updatedAt=${encodeURIComponent(versionValue)}`;
  }
};

const isLocalStaticImage = (url: string) => /^\/[^?]+/.test(url);

const toLocalWebpUrl = (url: string) => {
  if (!isLocalStaticImage(url)) return '';

  const match = url.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return '';

  const [, pathname, suffix = ''] = match;
  if (!/\.(jpe?g|png)$/i.test(pathname)) return '';

  return `${pathname.replace(/\.(jpe?g|png)$/i, '.webp')}${suffix}`;
};

const isSupabaseStorageImage = (url: string) =>
  url.includes('supabase.co') && url.includes('storage/v1/object/public');

const appendTransformParams = (
  url: string,
  params: { width: number; quality: number; format: 'webp' | 'avif' }
) => {
  if (!isSupabaseStorageImage(url)) return url;

  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
    parsed.searchParams.set('width', String(params.width));
    parsed.searchParams.set('quality', String(params.quality));
    parsed.searchParams.set('format', params.format);
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${params.width}&quality=${params.quality}&format=${params.format}`;
  }
};

const clampResponsiveWidth = (width: number) => {
  if (typeof window === 'undefined') return Math.min(width, DESKTOP_MAX_WIDTH);
  if (window.innerWidth <= 768) return Math.min(width, MOBILE_MAX_WIDTH);
  if (window.innerWidth <= 1024) return Math.min(width, TABLET_MAX_WIDTH);
  return Math.min(width, DESKTOP_MAX_WIDTH);
};

export const getOptimizedImage = (url: string, width = 600) => {
  const normalizedUrl = normalizeAppHostedStaticUrl(url);
  if (!normalizedUrl) return DEFAULT_IMAGE_FALLBACK;

  const targetWidth = clampResponsiveWidth(width);

  if (normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return normalizedUrl;
  }

  if (isSupabaseStorageImage(normalizedUrl) && !normalizedUrl.includes('width=')) {
    return appendTransformParams(normalizedUrl, {
      width: targetWidth,
      quality: IMAGE_QUALITY,
      format: 'webp',
    });
  }

  return normalizedUrl;
};

export const getResponsiveImageSources = (url: string) => {
  const normalizedUrl = normalizeAppHostedStaticUrl(url);
  if (!normalizedUrl || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return {
      src: normalizedUrl || DEFAULT_IMAGE_FALLBACK,
      webpSrcSet: '',
      avifSrcSet: '',
    };
  }

  if (!isSupabaseStorageImage(normalizedUrl)) {
    return {
      src: normalizedUrl,
      webpSrcSet: '',
      avifSrcSet: '',
    };
  }

  const widths = [MOBILE_MAX_WIDTH, TABLET_MAX_WIDTH, DESKTOP_MAX_WIDTH];

  const buildSrcSet = (format: 'webp' | 'avif') =>
    widths
      .map((width) => `${appendTransformParams(normalizedUrl, { width, quality: IMAGE_QUALITY, format })} ${width}w`)
      .join(', ');

  return {
    src: appendTransformParams(normalizedUrl, {
      width: clampResponsiveWidth(DESKTOP_MAX_WIDTH),
      quality: IMAGE_QUALITY,
      format: 'webp',
    }),
    webpSrcSet: buildSrcSet('webp'),
    avifSrcSet: buildSrcSet('avif'),
  };
};

export const getProductImageOrFallback = (images?: string[], width = 600) => {
  const firstImage = Array.isArray(images) ? images.find((img) => Boolean(String(img || '').trim())) : '';
  return getOptimizedImage(firstImage || DEFAULT_IMAGE_FALLBACK, width);
};

export const getProductImageSources = (images?: string[]) => {
  const firstImage = Array.isArray(images) ? images.find((img) => Boolean(String(img || '').trim())) : '';
  return getResponsiveImageSources(firstImage || DEFAULT_IMAGE_FALLBACK);
};
