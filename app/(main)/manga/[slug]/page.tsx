import { getMangaBySlugWithDetails, getChaptersForManga } from '@/actions/manga'; // Ajuste o caminho conforme sua estrutura
import { getPresignedUrl } from '@/actions/minio'; // Ajuste o caminho
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface MangaPageProps {
  params: {
    slug: string;
  };
}

// Função auxiliar para formatar datas
const formatDate = (dateString: string | Date) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default async function MangaPage({ params }: MangaPageProps) {
  // 1. Buscar dados do Mangá
  const src_ = await params;
  const manga = await getMangaBySlugWithDetails(src_.slug);

  if (!manga) {
    notFound();
  }

  // 2. Buscar Capítulos
  const chapters = await getChaptersForManga(manga.id);

  // 3. Gerar URLs assinadas (MinIO)
  // URL para a capa/banner
  const mangaCoverUrl = manga.thumbnail 
    ? await getPresignedUrl('mangas', manga.thumbnail) 
    : '/placeholder.jpg'; // Imagem fallback

  // URLs para as thumbnails dos capítulos
  const chaptersWithUrls = await Promise.all(
    chapters.map(async (cap) => ({
      ...cap,
      thumbnailUrl: cap.thumbnail 
        ? await getPresignedUrl('mangas', cap.thumbnail) 
        : null
    }))
  );

  // Lógica para os botões "Ler Primeiro" e "Ler Último"
  // Assumindo que a query já retorna ordenado por numero DESC, 
  // o último lançado é o índice 0 e o primeiro é o último índice.
  const latestChapter = chaptersWithUrls.length > 0 ? chaptersWithUrls[0] : null;
  const firstChapter = chaptersWithUrls.length > 0 ? chaptersWithUrls[chaptersWithUrls.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- BANNER DE FUNDO --- */}
      <div className="relative w-full h-[400px] overflow-hidden">
        {/* Imagem de fundo com Blur */}
        <div className="absolute inset-0">
            {mangaCoverUrl && (
                <Image
                    src={mangaCoverUrl}
                    alt="Background"
                    fill
                    priority
                    quality={60}
                    className="object-cover blur-md brightness-50 scale-110"
                    sizes="100vw"
                />
            )}
        </div>
        {/* Overlay gradiente para suavizar a transição para o branco */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-gray-50/90" />
      </div>

      {/* --- CONTEÚDO PRINCIPAL (Card Branco) --- */}
      <div className="container mx-auto px-4 relative z-10 -mt-32 sm:-mt-48">
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-8">
          
          {/* COLUNA ESQUERDA: Capa e Botões */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start w-full md:w-[280px]">
            {/* Capa do Mangá */}
            <div className="relative w-[240px] h-[340px] md:w-full md:h-[400px] rounded-xl overflow-hidden shadow-lg border-4 border-white mb-4">
              <Image
                src={mangaCoverUrl}
                alt={manga.titulo}
                fill
                priority
                quality={90}
                className="object-cover"
                sizes="(max-width: 768px) 240px, 280px"
              />
              
              {/* Badge de Status (ex: Atualizando) */}
              <div className="absolute top-2 right-2">
                 <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                    {manga.finalizado ? 'Finalizado' : 'Atualizando'}
                 </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 w-full justify-center md:justify-between">
              <Link 
                href={firstChapter ? `/ler/${manga.slug}/${firstChapter.numero}` : '#'}
                className={`flex-1 text-center py-2.5 px-2 rounded font-bold text-white text-sm uppercase transition-colors shadow-md
                  ${firstChapter ? 'bg-[#d1717c] hover:bg-[#c1616c]' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Ler Primeiro
              </Link>
              <Link 
                href={latestChapter ? `/ler/${manga.slug}/${latestChapter.numero}` : '#'}
                className={`flex-1 text-center py-2.5 px-2 rounded font-bold text-white text-sm uppercase transition-colors shadow-md
                  ${latestChapter ? 'bg-[#d1717c] hover:bg-[#c1616c]' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Ler Último
              </Link>
            </div>
          </div>

          {/* COLUNA DIREITA: Informações */}
          <div className="flex-1 pt-2 md:pt-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              {manga.titulo}
            </h1>

            <div className="grid grid-cols-1 gap-y-3 text-sm text-gray-700 mb-6">
 
              
              <div className="flex gap-2">
                <span className="font-bold w-24">Autor(es):</span>
                <div className="flex flex-wrap gap-1">
                  {manga.autores && manga.autores.length > 0 ? (
                    manga.autores.map((autor, i) => (
                      <span key={autor.id}>
                        <Link href={`/autor/${autor.slug}`} className="text-blue-600 hover:underline">
                          {autor.nome}
                        </Link>
                        {i < manga.autores.length - 1 && <span className="text-gray-500">, </span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Não informado</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="font-bold w-24">Artista(s):</span>
                <div className="flex flex-wrap gap-1">
                  {manga.artistas && manga.artistas.length > 0 ? (
                    manga.artistas.map((artista, i) => (
                      <span key={artista.id}>
                        <Link href={`/artista/${artista.slug}`} className="text-blue-600 hover:underline">
                          {artista.nome}
                        </Link>
                        {i < manga.artistas.length - 1 && <span className="text-gray-500">, </span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Não informado</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold w-24">Gênero(s):</span>
                <div className="flex flex-wrap gap-1">
                  {manga.generos && manga.generos.length > 0 ? (
                    manga.generos.map((genero, i) => (
                      <span key={genero.id}>
                        <Link href={`/genero/${genero.slug}`} className="text-gray-600 hover:text-red-500 transition-colors">
                          {genero.nome}
                        </Link>
                        {i < manga.generos.length - 1 && <span className="text-gray-500">, </span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Não informado</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold w-24">Tipo:</span>
                <span>Mangá</span>
              </div>

              <div className="flex gap-2">
                <span className="font-bold w-24">Ano:</span>
                <span>{manga.ano}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <h3 className="font-bold text-gray-800 mb-2">Sinopse</h3>
                <p className="text-gray-600 leading-relaxed text-sm text-justify">
                    {manga.sinopse || "Sem sinopse disponível para esta obra."}
                </p>
            </div>
          </div>
        </div>

        {/* --- SEÇÃO: ÚLTIMOS LANÇAMENTOS --- */}
        <div className="mt-10 bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Gradiente */}
          <div className="bg-gradient-to-r from-[#d1717c] to-[#f0c382] px-6 py-3 flex items-center justify-between">
             <div className="flex items-center gap-2 text-white font-bold uppercase text-sm drop-shadow-sm">

                Últimos Lançamentos
             </div>
             {/* Ícone de ordenação (decorativo) */}
             <div className="text-white text-xs cursor-pointer">⇅</div>
          </div>

          <div className="p-6">
            {chaptersWithUrls.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum capítulo encontrado.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chaptersWithUrls.map((chapter) => (
                        <Link 
                            key={chapter.id} 
                            href={`${manga.slug}/${chapter.numero}`}
                            className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                            {/* Thumbnail do Capítulo */}
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 border border-gray-200">
                                {chapter.thumbnailUrl ? (
                                    <Image
                                        src={chapter.thumbnailUrl}
                                        alt={`Capítulo ${chapter.numero}`}
                                        fill
                                        loading="lazy"
                                        quality={75}
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        sizes="80px"
                                    />
                                ) : (
                                    // Fallback visual se não tiver thumb específica do capítulo
                                    <Image
                                        src={mangaCoverUrl}
                                        alt="Capa"
                                        fill
                                        loading="lazy"
                                        quality={60}
                                        className="object-cover opacity-60 grayscale"
                                        sizes="80px"
                                    />
                                )}
                            </div>

                            {/* Info do Capítulo */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 group-hover:text-[#d1717c] transition-colors">
                                    {chapter.titulo ? `${chapter.numero} - ${chapter.titulo}` : `Capítulo ${chapter.numero}`}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    {formatDate(chapter.created_at)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* --- SEÇÃO: DISCUSSÃO (Visual) --- */}
        <div className="mt-8 mb-10 bg-white rounded-lg shadow-lg overflow-hidden">
             <div className="bg-gradient-to-r from-[#d1717c] to-[#f0c382] px-6 py-3">
                 <div className="text-white font-bold uppercase text-sm drop-shadow-sm text-center">
                    Manga Discussion
                 </div>
             </div>
             <div className="p-6 text-center text-gray-400 text-sm">
                Comentários desabilitados temporariamente.
             </div>
        </div>

      </div>
    </div>
  );
}