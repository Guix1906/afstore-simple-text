import { getOptimizedImage } from '../../utils/imageOptimizer';

interface ProductGalleryProps {
  images: string[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="flex flex-col w-full bg-brand-bg -mt-4">
      {images.map((imgUrl, i) => (
        <div key={i} className="w-full relative overflow-hidden bg-brand-card">
          <img
            src={getOptimizedImage(imgUrl, 800)}
            alt={`Foto ${i + 1}`}
            className="w-full h-auto object-cover min-h-[50vh]"
            referrerPolicy="no-referrer"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}

