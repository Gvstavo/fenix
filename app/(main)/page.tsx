import { fetchMangasForHome, fetchTopViewedMangas } from '@/actions/manga.tsx';
import { getPresignedUrl } from '@/actions/minio.ts';
import Link from 'next/link';
import Image from 'next/image';

interface HomePageProps {
  searchParams: {
    page?: string;
  };
}

// Função auxiliar para verificar se o capítulo tem menos de 7 dias
const isChapterNew = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
};

export default async function Home({ searchParams }: HomePageProps) {
  const src_ = await searchParams;
  const currentPage = Number(src_.page) || 1;
  const { mangas, totalCount } = await fetchMangasForHome(currentPage);
  const topMangas = await fetchTopViewedMangas();
  
  const totalPages = Math.ceil(totalCount / 12);

  const mangasWithUrls = await Promise.all(
    mangas.map(async (manga) => ({
      ...manga,
      thumbnailUrl: manga.thumbnail ? await getPresignedUrl('mangas', manga.thumbnail) : null,
      // Processa os capítulos vindos do banco
      // O 'any' aqui é porque o tipo Manga provavelmente ainda não tem 'latest_chapters' definido na interface
      latestChapters: manga.latest_chapters?.map((cap) => ({
          number: cap.numero,
          isNew: isChapterNew(cap.created_at)
      })) || []
    }))
  );

  const topMangasWithUrls = await Promise.all(
    topMangas.map(async (manga) => ({
      ...manga,
      thumbnailUrl: manga.thumbnail ? await getPresignedUrl('mangas', manga.thumbnail) : null,
    }))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content - Manga Grid */}
        <div className="flex-1">
          {/* Header Gradiente "Atualizados Recentemente" */}
          <div className="mb-8 rounded-lg bg-gradient-to-r from-pink-300 via-orange-200 to-white/0 p-1">
             <div className="bg-gradient-to-r from-pink-400 to-orange-300 text-white text-center font-bold uppercase py-2 rounded-md shadow-sm">
                Atualizados Recentemente
             </div>
          </div>
          
          {mangas.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Nenhum mangá encontrado.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {mangasWithUrls.map((manga, index) => (
                  <div key={manga.id} className="flex flex-col">
                    <Link href={`/manga/${manga.slug}`} className="group block relative">
                      {/* Card Image Wrapper */}
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-200 mb-3 shadow-md">
                        {manga.thumbnailUrl && (
                          <Image
                            src={manga.thumbnailUrl}
                            alt={manga.titulo}
                            fill
                            priority={index < 4}
                            loading={index < 4 ? undefined : 'lazy'}
                            quality={85}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                           {manga.adulto && (
                            <span className="bg-[#e65f5f] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                              +18
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Info Area */}
                    <div className="text-center px-1">
                        <Link href={`/manga/${manga.slug}`}>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 hover:text-pink-500 transition-colors mb-2">
                            {manga.titulo}
                            </h3>
                        </Link>
                        
                        {/* Botões de Capítulos DINÂMICOS */}
                        <div className="flex flex-col gap-1.5 mt-1">
                            {manga.latestChapters.length > 0 ? (
                                manga.latestChapters.map((chapter, index: number) => (
                                    <Link 
                                        key={index}
                                        href={`/manga/${manga.slug}/${chapter.number}`} // Ajuste a rota conforme seu sistema de leitura
                                        className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
                                    >
                                        <span>Capítulo {chapter.number}</span>
                                        {chapter.isNew && (
                                            <span className="bg-orange-300 text-white text-[9px] px-1 rounded ml-1">NOVO</span>
                                        )}
                                    </Link>
                                ))
                            ) : (
                                <div className="text-xs text-gray-400 py-1">Sem capítulos</div>
                            )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination (Mantida igual) */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 text-sm font-medium">
                  <Link
                    href={`?page=${Math.max(1, currentPage - 1)}`}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      currentPage === 1
                        ? 'text-gray-400 pointer-events-none'
                        : 'text-gray-600 hover:bg-pink-100 hover:text-pink-600'
                    }`}
                  >
                    Anterior
                  </Link>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Link
                          key={pageNum}
                          href={`?page=${pageNum}`}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                            currentPage === pageNum
                              ? 'bg-pink-400 text-white shadow-md transform scale-110'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>
                  
                  <Link
                    href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      currentPage === totalPages
                        ? 'text-gray-400 pointer-events-none'
                        : 'text-gray-600 hover:bg-pink-100 hover:text-pink-600'
                    }`}
                  >
                    Próxima
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar - Top Viewed Mangas (Mantido igual) */}
        <aside className="w-full lg:w-80">
             {/* ... (conteúdo da sidebar) */}
             {/* Você pode aplicar a mesma lógica de chapters aqui se quiser, 
                 mas precisaria atualizar a query fetchTopViewedMangas também */}
             <div className="sticky top-4">
                <div className="mb-6 rounded-lg bg-gradient-to-r from-pink-200 to-orange-100 p-1 shadow-sm">
                    <div className="bg-gradient-to-r from-pink-300 to-orange-200 text-white text-center text-sm font-bold uppercase py-2 rounded">
                        Os Mais Lidos Do Nosso Ninho
                    </div>
                </div>

                <div className="space-y-4 bg-white rounded-xl">
                  {topMangasWithUrls.map((manga, index) => (
                    <div key={manga.id} className="group border-b border-dashed border-gray-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex gap-4">
                        <Link href={`/manga/${manga.slug}`} className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 shadow-sm">
                            {manga.thumbnailUrl && (
                            <Image
                                src={manga.thumbnailUrl}
                                alt={manga.titulo}
                                fill
                                loading="lazy"
                                quality={75}
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="80px"
                            />
                            )}
                        </Link>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <Link href={`/manga/${manga.slug}`}>
                            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-pink-500 transition-colors leading-snug">
                                {manga.titulo}
                            </h3>
                          </Link>
                          {/* Nota: Para exibir capítulos na sidebar, a query fetchTopViewedMangas 
                              também precisaria da subquery JSON_AGG que fizemos acima. */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
        </aside>
      </div>
    </div>
  );
}