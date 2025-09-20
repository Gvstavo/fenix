// Este é um Componente de Servidor por padrão.
// O layout 'admin/layout.tsx' já faz a verificação de admin.
import { MangasTable } from '@/src/components/manga/tabela.tsx';
import { 
  Box, 
  Typography, 
} from '@mui/material';
import { fetchMangasByPage } from '@/actions/manga.tsx';
import {fetchAllArtists} from '@/actions/artista.tsx';
import {fetchAllAutores} from '@/actions/autor.tsx';
import {fetchAllGeneros} from '@/actions/genero.tsx';
import { getSession } from "@/app/lib/session";

export default async function AdminGenerosPage({
  searchParams,
}: {
  // Recebemos os parâmetros da URL para saber qual página buscar
  searchParams?: {
    page?: string;
    limit?: string;
    query?: string;

  };
}) {
  //const currentPage = Number( searchParams?.page) || 1;
  const {page, query} = await searchParams;
  const session = await getSession();
  // Chama a Server Action para buscar os dados da página atual
  const { mangas, totalCount } = await fetchMangasByPage(page  || 1, query, session.id, session.admin);
  const {autores} = await fetchAllAutores();
  const {artists} = await fetchAllArtists();
  const {generos} = await fetchAllGeneros();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Mangás
      </Typography>
      
      {/* Renderiza a tabela passando os dados buscados como props */}
      <MangasTable 
        mangas={mangas}
        totalCount={totalCount} 
        autores={autores}
        artistas={artists}
        generos={generos}
        currentUserId={session.id}
      />
    </Box>
  );
}