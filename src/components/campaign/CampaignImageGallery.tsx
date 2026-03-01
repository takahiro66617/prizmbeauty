import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface CampaignImageGalleryProps {
  imageUrls: string[];
  imageUrl?: string | null;
  title: string;
  category?: string | null;
  className?: string;
}

export function CampaignImageGallery({ imageUrls, imageUrl, title, category, className = "" }: CampaignImageGalleryProps) {
  const allImages = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [current, setCurrent] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-muted ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <FileText className="w-16 h-16" />
        </div>
        {category && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-card/90 backdrop-blur rounded-full text-sm font-bold shadow-sm">{category}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted shadow-soft">
        <img src={allImages[current]} alt={`${title} - ${current + 1}`} className="w-full h-full object-cover" />
        {category && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-card/90 backdrop-blur rounded-full text-sm font-bold shadow-sm">{category}</span>
          </div>
        )}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(prev => (prev - 1 + allImages.length) % allImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrent(prev => (prev + 1) % allImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((url, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === current ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
