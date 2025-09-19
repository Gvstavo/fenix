// Este é um Componente de Servidor por padrão.
// O layout 'admin/layout.tsx' já faz a verificação de admin.
import { UsersTable } from '@/src/components/usuario/tabela.tsx';
import { 
  Box, 
  Typography, 
} from '@mui/material';
import { fetchUsersByPage } from '@/actions/usuario.tsx';


export default async function AdminUsersPage({
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
  const { users, totalCount } = await fetchUsersByPage(page  || 1);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciamento de Usuários
      </Typography>
      
      {/* Renderiza a tabela passando os dados buscados como props */}
      <UsersTable 
        users={users}
        totalCount={totalCount} 
      />
    </Box>
  );
}