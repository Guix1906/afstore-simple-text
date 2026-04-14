import { ImgHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';

interface StableImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
  showSkeleton?: boolean;
  webpSrcSet?: string;
  avifSrcSet?: string;
  imgSizes?: string;
}

export default function StableImage({
  src,
  fallbackSrc,
  alt,
  className,
  showSkeleton = true,
  onError,
  onLoad,
  webpSrcSet,
  avifSrcSet,
  imgSizes,
  ...imgProps
}: StableImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [isVisible, setIsVisible] = useState(() => imgProps.loading !== 'lazy');

  useEffect(() => {
    setIsLoaded(false);
    setRetryCount(0);
    setIsFallback(false);
    setIsVisible(imgProps.loading !== 'lazy');
  }, [src]);

  useEffect(() => {
    if (imgProps.loading !== 'lazy' || isVisible) return;

    const node = imgRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '220px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [imgProps.loading, isVisible]);

  const resolvedSrc = useMemo(() => {
    if (!isVisible) return '';
    if (!src || isFallback) return fallbackSrc;

    if (retryCount === 0) return src;

    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}retry=${retryCount}`;
  }, [fallbackSrc, isFallback, isVisible, retryCount, src]);

  return (
    <>
      {showSkeleton && !isLoaded && <div className="absolute inset-0 bg-brand-card/60 animate-pulse" aria-hidden="true" />}
      <picture>
        {isVisible && avifSrcSet && !isFallback && <source type="image/avif" srcSet={avifSrcSet} sizes={imgSizes} />}
        {isVisible && webpSrcSet && !isFallback && <source type="image/webp" srcSet={webpSrcSet} sizes={imgSizes} />}
        <img
          {...imgProps}
          ref={imgRef}
          src={resolvedSrc}
          sizes={imgSizes}
          alt={alt}
          className={className}
          onLoad={(event) => {
            setIsLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            if (!isFallback && retryCount < 1 && src) {
              setRetryCount((prev) => prev + 1);
              return;
            }

            setIsFallback(true);
            setIsLoaded(true);
            onError?.(event);
          }}
        />
      </picture>
    </>
  );
}
