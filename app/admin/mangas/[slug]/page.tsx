import { Box, Typography } from '@mui/material';
import { notFound } from 'next/navigation';
import { getMangaBySlug } from '@/actions/manga.tsx'; 
import { fetchChaptersForManga } from '@/actions/capitulo.ts'; // Nova action para buscar capítulos
import { CapitulosTable } from '@/src/components/capitulo/tabela.tsx'; // Componente de tabela para capítulos

// Força a página a ser sempre renderizada dinamicamente
export const dynamic = 'force-dynamic';

// A interface de props agora inclui 'params' para o slug
interface PageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    page?: string;
    query?: string;
  };
}

export default async function AdminCapitulosPage({ params, searchParams }: PageProps) {
  const {slug} = await params;
  const {page, query} = await searchParams;
  
  const manga = await getMangaBySlug(slug);
  const { capitulos, totalCount } = await fetchChaptersForManga(manga.id,page  || 1, query || "");

  if (!manga) {
    notFound();
  }

/*  const { chapters, totalCount } = await fetchChaptersForManga({
    mangaId: manga.id,
    page: currentPage,
    query: query
  });
*/
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        {manga.titulo}
      </Typography>
      
      <CapitulosTable 
        capitulos={capitulos}
        totalCount={totalCount} 
        manga={manga} // Passa o ID do mangá para o modal de criação de capítulo
      />
    </Box>
  );
}