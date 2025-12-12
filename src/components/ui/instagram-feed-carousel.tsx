'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Instagram, ExternalLink, Loader2 } from 'lucide-react';

interface InstagramPost {
  src: string;
  alt: string;
  caption: string;
  permalink: string;
}

interface InstagramFeedCarouselProps {
  /** Número de posts a buscar */
  limit?: number;
  /** Posts estáticos (fallback se a API falhar) */
  fallbackImages?: { src: string; alt: string; caption: string }[];
  /** Classe CSS adicional */
  className?: string;
}

export function InstagramFeedCarousel({ 
  limit = 6, 
  fallbackImages = [],
  className = '' 
}: InstagramFeedCarouselProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`/api/instagram/posts?limit=${limit}&format=carousel`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          setPosts(data.data);
        } else {
          // Usa fallback se não houver posts
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao carregar feed do Instagram:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [limit]);

  const displayPosts = error || posts.length === 0 
    ? fallbackImages.map(img => ({ ...img, permalink: '' }))
    : posts;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayPosts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayPosts.length) % displayPosts.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className={`bg-[#1E202F]/50 rounded-2xl p-8 flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#E38817] animate-spin mx-auto mb-4" />
          <p className="text-[#D9D9D9]/60">Carregando feed do Instagram...</p>
        </div>
      </div>
    );
  }

  if (displayPosts.length === 0) {
    return (
      <div className={`bg-[#1E202F]/50 rounded-2xl p-8 flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <Instagram className="w-12 h-12 text-[#D9D9D9]/30 mx-auto mb-4" />
          <p className="text-[#D9D9D9]/60">Nenhum post disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1E202F]/50 rounded-2xl overflow-hidden ${className}`}>
      {/* Header estilo Instagram */}
      <div className="flex items-center gap-3 p-4 border-b border-[#E38817]/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#dc2743] p-[2px]">
          <div className="w-full h-full rounded-full bg-[#1E202F] flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <span className="font-semibold text-[#D9D9D9]">@waveigl</span>
          {!error && <span className="text-xs text-[#D9D9D9]/50 ml-2">• Feed ao vivo</span>}
        </div>
        {displayPosts[currentIndex]?.permalink && (
          <a 
            href={displayPosts[currentIndex].permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E38817] hover:text-[#E38817]/80 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Carrossel */}
      <div className="relative aspect-square bg-black">
        {displayPosts.map((post, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentIndex 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <Image
              src={post.src}
              alt={post.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Navegação */}
        {displayPosts.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
              title="Post anterior"
              aria-label="Post anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
              title="Próximo post"
              aria-label="Próximo post"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Contador de slides */}
        {displayPosts.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1}/{displayPosts.length}
          </div>
        )}
      </div>

      {/* Caption */}
      {displayPosts[currentIndex]?.caption && (
        <div className="p-4 border-t border-[#E38817]/10">
          <p className="text-sm text-[#D9D9D9]/80 line-clamp-2">
            {displayPosts[currentIndex].caption}
          </p>
        </div>
      )}

      {/* Indicadores */}
      {displayPosts.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {displayPosts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-[#E38817] w-4' 
                  : 'bg-[#D9D9D9]/30 hover:bg-[#D9D9D9]/50'
              }`}
              title={`Ir para post ${index + 1}`}
              aria-label={`Ir para post ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

