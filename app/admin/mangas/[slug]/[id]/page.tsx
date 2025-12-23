// app/admin/mangas/[slug]/[id]/page.tsx

import { PaginasTable } from '@/src/components/pagina/tabela.tsx'; // Ajuste o caminho conforme onde salvou a tabela
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { fetchPaginasByCapituloId } from '@/actions/pagina.ts';
import Link from 'next/link';

export default async function AdminPaginasPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  // Em Next.js 15+ params é uma Promise
  const { slug, id } = await params;
  const capituloId = parseInt(id, 10);

  // Busca as páginas e informações do capítulo
  const { paginas, info } = await fetchPaginasByCapituloId(capituloId);

  return (
    <Box>

      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Páginas
        <Typography component="span" variant="h5" sx={{ ml: 2, color: 'text.secondary' }}>
           (Capítulo {info.numero})
        </Typography>
      </Typography>
      
      {/* Renderiza a tabela passando os dados buscados */}
      <PaginasTable 
        paginas={paginas}
        capituloId={capituloId}
        mangaSlug={slug}
      />
    </Box>
  );
}