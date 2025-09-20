// Este é um Componente de Servidor por padrão.
// O layout 'admin/layout.tsx' já faz a verificação de admin.
import { ArtistsTable } from '@/src/components/artista/tabela.tsx';
import { 
  Box, 
  Typography, 
} from '@mui/material';
import { fetchArtistsByPage } from '@/actions/artista.tsx';
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export default async function AdminArtistsPage({
  searchParams,
}: {
  // Recebemos os parâmetros da URL para saber qual página buscar
  searchParams?: {
    page?: string;
    limit?: string;
    query?: string;

  };
}) {


  const session = await getSession();
  if (!session?.admin) {
    redirect('/'); // Redireciona para a home se não for admin
  }

  const {page, query} = await searchParams;
  // Chama a Server Action para buscar os dados da página atual
  const { artists, totalCount } = await fetchArtistsByPage(page  || 1, query);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Artistas
      </Typography>
      
      {/* Renderiza a tabela passando os dados buscados como props */}
      <ArtistsTable 
        artists={artists}
        totalCount={totalCount} 
      />
    </Box>
  );
}