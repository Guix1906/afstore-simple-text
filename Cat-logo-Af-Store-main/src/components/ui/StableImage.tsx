import { ImgHTMLAttributes, useEffect, useMemo, useState } from 'react';

interface StableImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
  showSkeleton?: boolean;
}

export default function StableImage({
  src,
  fallbackSrc,
  alt,
  className,
  showSkeleton = true,
  onError,
  onLoad,
  ...imgProps
}: StableImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setRetryCount(0);
    setIsFallback(false);
  }, [src]);

  const resolvedSrc = useMemo(() => {
    if (!src || isFallback) return fallbackSrc;

    if (retryCount === 0) return src;

    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}retry=${retryCount}`;
  }, [fallbackSrc, isFallback, retryCount, src]);

  return (
    <>
      {showSkeleton && !isLoaded && <div className="absolute inset-0 bg-brand-card/60 animate-pulse" aria-hidden="true" />}
      <img
        {...imgProps}
        src={resolvedSrc}
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
    </>
  );
}
