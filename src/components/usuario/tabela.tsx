'use client';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Button,
  Toolbar,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { Usuario } from '@/src/models.tsx'; // Importando seu tipo Usuario

interface UsersTableProps {
  users: Usuario[];
  totalCount: number;
}

// Definimos o número de itens por página como uma constante
const ITEMS_PER_PAGE = 20;

export function UsersTable({ users, totalCount }: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // A página atual é lida da URL. O componente de paginação é 0-indexado.
  const page = Number(searchParams.get('page')) - 1 || 0;

  // A função para mudar de página permanece a mesma
  const handleChangePage = (event: unknown, newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', (newPage + 1).toString());
    router.push(`?${params.toString()}`);
  };

  const handleEdit = (id: string) => console.log(`Editar usuário com ID: ${id}`);
  const handleDelete = (id: string) => console.log(`Excluir usuário com ID: ${id}`);
  const handleCreate = () => console.log('Abrir formulário para criar novo usuário');

  return (
    <Box>
      <Toolbar sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          display: 'flex',
          justifyContent: 'space-between', // Alinha o título à esquerda e os controles à direita
          bgcolor: 'background.paper',
          borderRadius: 2,
          mb: 2,
          boxShadow: 1
        }} >
        <Typography sx={{ fontWeight: 'bold' }} variant="h6" component="div">
          Usuários
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField variant="outlined" size="small" placeholder="Pesquisar..." InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), sx: { borderRadius: '20px', fontSize: '0.875rem' } }} />
          <IconButton title="Filtrar lista"><FilterListIcon /></IconButton>
          <Button variant="contained" onClick={handleCreate} startIcon={<AddIcon />} sx={{ bgcolor: '#d1717c', borderRadius: '20px', px: 3, textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#b55a66' } }}>
            Criar
          </Button>
        </Box>
      </Toolbar>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: 1 }}>
        <TableContainer>
          <Table stickyHeader aria-label="Tabela de Usuários">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Data de Criação</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Admin</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nome || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {user.admin && <Chip label="Admin" size="small" sx={{ bgcolor: '#d1717c', color: 'white', fontWeight: 'bold' }} />}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(user.id)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(user.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">Nenhum usuário encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Lógica de paginação simplificada e corrigida */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          // --- Alterações para garantir o comportamento correto ---
          rowsPerPage={ITEMS_PER_PAGE} // Usa um valor fixo, consistente com o backend
          rowsPerPageOptions={[]}     // Remove a opção de mudar o número de linhas por página
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>
    </Box>
  );
}