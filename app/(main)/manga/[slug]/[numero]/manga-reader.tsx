'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface Page {
  id: number;
  numero: number;
  imageUrl: string | null;
}

interface MangaReaderProps {
  pages: Page[];
}

export function MangaReader({ pages }: MangaReaderProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
  const currentZoomIndex = zoomLevels.indexOf(zoomLevel);

  const handleZoomIn = () => {
    if (currentZoomIndex < zoomLevels.length - 1) {
      setZoomLevel(zoomLevels[currentZoomIndex + 1]);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomOut = () => {
    if (currentZoomIndex > 0) {
      setZoomLevel(zoomLevels[currentZoomIndex - 1]);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Reset position when zoom changes to 1
  useEffect(() => {
    if (zoomLevel === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentZoomIndex]);

  return (
    <>
      {/* Controles de Zoom */}
      <div className="fixed right-4 top-20 z-40 flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <button
          onClick={handleZoomIn}
          disabled={currentZoomIndex >= zoomLevels.length - 1}
          className="p-2 text-white hover:text-[#d1717c] disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        
        <div className="text-white text-xs text-center font-medium py-1">
          {Math.round(zoomLevel * 100)}%
        </div>
        
        <button
          onClick={handleZoomOut}
          disabled={currentZoomIndex <= 0}
          className="p-2 text-white hover:text-[#d1717c] disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Área de leitura */}
      <div
        ref={containerRef}
        className={`space-y-0 ${zoomLevel > 1 ? 'cursor-move' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {pages.map((page, index) => (
          <div 
            key={page.id} 
            className="relative w-full bg-black overflow-hidden"
            style={{
              transform: zoomLevel > 1 ? `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)` : 'none',
              transformOrigin: 'center top',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
          >
            {page.imageUrl ? (
              <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                <Image
                  src={page.imageUrl}
                  alt={`Página ${page.numero}`}
                  fill
                  priority={index < 3}
                  loading={index < 3 ? undefined : 'lazy'}
                  quality={95}
                  className="object-contain pointer-events-none select-none"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[600px] bg-gray-900 text-gray-400">
                <p>Imagem não disponível</p>
              </div>
            )}
            
            {/* Número da página */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm pointer-events-none">
              {page.numero} / {pages.length}
            </div>
          </div>
        ))}
      </div>

      {/* Instruções de zoom (aparece brevemente) */}
      {zoomLevel === 1 && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
          Use + / - para zoom ou Ctrl + Scroll
        </div>
      )}
    </>
  );
}
