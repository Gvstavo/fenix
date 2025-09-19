// Este é um Componente de Servidor por padrão.
// O layout 'admin/layout.tsx' já faz a verificação de admin.
import { GenerosTable } from '@/src/components/genero/tabela.tsx';
import { 
  Box, 
  Typography, 
} from '@mui/material';
import { fetchGenerosByPage } from '@/actions/genero.tsx';


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
  // Chama a Server Action para buscar os dados da página atual
  const { generos, totalCount } = await fetchGenerosByPage(page  || 1, query);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Gêneros
      </Typography>
      
      {/* Renderiza a tabela passando os dados buscados como props */}
      <GenerosTable 
        generos={generos}
        totalCount={totalCount} 
      />
    </Box>
  );
}