import { getChapterForReading, getPagesForReading, getAdjacentChapters } from '@/actions/pagina';
import { getPresignedUrl } from '@/actions/minio';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home, List } from 'lucide-react';
import { MangaReader } from './manga-reader';

interface ReaderPageProps {
  params: {
    slug: string;
    numero: string;
  };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug, numero } = await params;
  const numeroCapitulo = parseInt(numero, 10);

  if (isNaN(numeroCapitulo)) {
    notFound();
  }

  // 1. Buscar informações do capítulo
  const chapter = await getChapterForReading(slug, numeroCapitulo);
  
  if (!chapter) {
    notFound();
  }

  // 2. Buscar páginas do capítulo
  const pages = await getPagesForReading(chapter.id);

  // 3. Buscar capítulos adjacentes
  const { anterior, proximo } = await getAdjacentChapters(chapter.manga_id, numeroCapitulo);

  // 4. Gerar URLs pré-assinadas para todas as páginas
  const pagesWithUrls = await Promise.all(
    pages.map(async (page) => ({
      ...page,
      imageUrl: page.url ? await getPresignedUrl('mangas', page.url) : null,
    }))
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-white">
            {/* Esquerda: Voltar */}
            <Link 
              href={`/manga/${slug}`}
              className="flex items-center gap-2 hover:text-[#d1717c] transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>

            {/* Centro: Info do capítulo */}
            <div className="flex-1 text-center px-4">
              <h1 className="font-bold text-sm sm:text-base truncate">
                {chapter.manga_titulo}
              </h1>
              <p className="text-xs text-gray-300">
                Capítulo {chapter.numero}
                {chapter.titulo && ` - ${chapter.titulo}`}
              </p>
            </div>

            {/* Direita: Lista de capítulos */}
            <Link 
              href={`/manga/${slug}#capitulos`}
              className="flex items-center gap-2 hover:text-[#d1717c] transition-colors"
            >
              <span className="hidden sm:inline">Capítulos</span>
              <List className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Área de leitura */}
      <main className="pt-16 pb-20">
        <div className="container mx-auto max-w-4xl">
          {pagesWithUrls.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh] text-white">
              <p className="text-lg">Nenhuma página encontrada neste capítulo.</p>
            </div>
          ) : (
            <MangaReader pages={pagesWithUrls} />
          )}
        </div>
      </main>

      {/* Footer fixo com navegação */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Botão Anterior */}
            {anterior ? (
              <Link
                href={`/manga/${slug}/${anterior}`}
                className="flex items-center gap-2 px-6 py-3 bg-[#d1717c] hover:bg-[#c1616c] text-white rounded-lg transition-colors font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <div className="px-6 py-3 bg-gray-800 text-gray-500 rounded-lg font-medium opacity-50 cursor-not-allowed flex items-center gap-2">
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Anterior</span>
              </div>
            )}

            {/* Info central */}
            <div className="flex-1 text-center text-white text-sm">
              <p className="font-medium">Capítulo {chapter.numero}</p>
              <p className="text-xs text-gray-400">{pagesWithUrls.length} páginas</p>
            </div>

            {/* Botão Próximo */}
            {proximo ? (
              <Link
                href={`/manga/${slug}/${proximo}`}
                className="flex items-center gap-2 px-6 py-3 bg-[#d1717c] hover:bg-[#c1616c] text-white rounded-lg transition-colors font-medium"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="px-6 py-3 bg-gray-800 text-gray-500 rounded-lg font-medium opacity-50 cursor-not-allowed flex items-center gap-2">
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
