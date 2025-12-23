// app/admin/mangas/[slug]/[id]/page.tsx
import { PaginasTable } from '@/src/components/pagina/tabela';
import { Box, Typography } from '@mui/material';
import { fetchPaginasByCapituloId } from '@/actions/pagina';

export default async function AdminPaginasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams?: Promise<{ page?: string; query?: string }>;
}) {
  const { slug, id } = await params;
  const resolvedSearchParams = await searchParams;
  
  const capituloId = parseInt(id, 10);
  const page = Number(resolvedSearchParams?.page) || 1;
  const query = resolvedSearchParams?.query || '';

  // Busca paginada
  const { paginas, totalCount, info } = await fetchPaginasByCapituloId(capituloId, page, query);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Páginas
      </Typography>
      
      <PaginasTable 
        paginas={paginas}
        totalCount={totalCount}
        capituloId={capituloId}
        mangaSlug={slug}
        capituloInfo={info}
      />
    </Box>
  );
}