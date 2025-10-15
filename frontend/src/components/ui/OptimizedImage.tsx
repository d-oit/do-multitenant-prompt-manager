import { useState, useEffect, useRef, type ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: string;
  webpSrc?: string;
  srcSet?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading, WebP support, and placeholders
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder,
  webpSrc,
  srcSet,
  sizes,
  onLoad,
  onError,
  className = "",
  ...props
}: OptimizedImageProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px" // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Construct responsive srcSet if not provided
  const responsiveSrcSet =
    srcSet || (width ? `${src} 1x, ${src.replace(/\.(jpg|png)$/, "@2x.$1")} 2x` : undefined);

  // Construct sizes if not provided
  const responsiveSizes =
    sizes || (width ? `(max-width: ${width}px) 100vw, ${width}px` : undefined);

  return (
    <div
      className={`optimized-image ${className}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          className="optimized-image__placeholder"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(10px)",
            transform: "scale(1.1)"
          }}
        />
      )}

      {/* Skeleton loader */}
      {!isLoaded && !placeholder && (
        <div
          className="optimized-image__skeleton"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "var(--pm-color-surface-alt)",
            animation: "pulse 1.5s ease-in-out infinite"
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="optimized-image__error"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "var(--pm-color-surface-alt)",
            color: "var(--pm-color-text-muted)",
            fontSize: "var(--pm-font-size-sm)"
          }}
        >
          Failed to load image
        </div>
      )}

      {/* Actual image */}
      {!hasError && isInView && (
        <picture>
          {/* WebP source for modern browsers */}
          {webpSrc && <source type="image/webp" srcSet={webpSrc} sizes={responsiveSizes} />}

          {/* Fallback image */}
          <img
            ref={imgRef}
            src={src}
            srcSet={responsiveSrcSet}
            sizes={responsiveSizes}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? "lazy" : "eager"}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`optimized-image__img ${isLoaded ? "optimized-image__img--loaded" : ""}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in-out"
            }}
            {...props}
          />
        </picture>
      )}
    </div>
  );
}

/**
 * Generate WebP URL from standard image URL
 */
export function getWebPUrl(url: string): string {
  return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

/**
 * Generate responsive srcSet string
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  return widths
    .map((width) => {
      const url = baseUrl.replace(/(\.\w+)$/, `_${width}w$1`);
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Generate sizes string based on breakpoints
 */
export function generateSizes(breakpoints: Array<[number, string]>): string {
  return breakpoints.map(([width, size]) => `(max-width: ${width}px) ${size}`).join(", ");
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options?: { as?: string; type?: string }): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = options?.as || "image";
  link.href = src;

  if (options?.type) {
    link.type = options.type;
  }

  document.head.appendChild(link);
}

/**
 * Create a low-quality placeholder from image
 */
export function createPlaceholder(src: string, quality = 10): string {
  // This would typically be done server-side
  // For client-side, we can use a very small image or a blurred version
  return src.replace(/(\.\w+)$/, `_placeholder$1?q=${quality}`);
}

export default OptimizedImage;
