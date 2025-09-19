// Este é um Componente de Servidor por padrão.
// O layout 'admin/layout.tsx' já faz a verificação de admin.
import { AutoresTable } from '@/src/components/autor/tabela.tsx';
import { 
  Box, 
  Typography, 
} from '@mui/material';
import { fetchAutoresByPage } from '@/actions/autor.tsx';


export default async function AdminAutoresPage({
  searchParams,
}: {
  // Recebemos os parâmetros da URL para saber qual página buscar
  searchParams?: {
    page?: string;
    limit?: string;
  };
}) {
  //const currentPage = Number( searchParams?.page) || 1;
  const {page} = await searchParams;
  // Chama a Server Action para buscar os dados da página atual
  const { autores, totalCount } = await fetchAutoresByPage(page  || 1);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Autores
      </Typography>
      
      {/* Renderiza a tabela passando os dados buscados como props */}
      <AutoresTable 
        autores={autores}
        totalCount={totalCount} 
      />
    </Box>
  );
}