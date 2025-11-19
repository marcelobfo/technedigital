import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  altPrefix?: string;
}

export function ImageLightbox({ 
  images, 
  initialIndex, 
  isOpen, 
  onClose,
  altPrefix = 'Imagem'
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-sm border-border">
        <div className="relative w-full h-[95vh] flex flex-col">
          {/* Header with close button and counter */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
            {images.length > 1 && (
              <div className="px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-md border border-border text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </DialogClose>
          </div>

          {/* Main image area with scroll */}
          <ScrollArea className="w-full h-full">
            <div className="flex justify-center p-8">
              <img
                src={images[currentIndex]}
                alt={`${altPrefix} ${currentIndex + 1}`}
                className="w-auto max-w-full"
              />
            </div>
          </ScrollArea>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2",
                  "bg-background/80 backdrop-blur-sm hover:bg-background",
                  "h-12 w-12"
                )}
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Imagem anterior</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2",
                  "bg-background/80 backdrop-blur-sm hover:bg-background",
                  "h-12 w-12"
                )}
              >
                <ChevronRight className="h-6 w-6" />
                <span className="sr-only">Próxima imagem</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
