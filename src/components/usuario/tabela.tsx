'use client';
import React, { useState } from 'react';
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
  Chip,
  Snackbar,
  Alert,
  type AlertColor,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { Usuario } from '@/src/models.tsx'; // Importando seu tipo Usuario
import { deleteUser } from '@/actions/usuario.tsx'; // <-- 1. Importe a nova ação
import { UserFormModal } from './modal.tsx'; // <-- Importa o novo modal
interface UsersTableProps {
  users: Usuario[];
  totalCount: number;
}

// Definimos o número de itens por página como uma constante
const ITEMS_PER_PAGE = 20;

export function UsersTable({ users, totalCount }: UsersTableProps) {

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    // Sempre volta para a primeira página ao fazer uma nova busca
    params.set('page', '1'); 
    
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query'); // Remove o parâmetro se a busca estiver vazia
    }
    
    // Atualiza a URL com os novos parâmetros
    router.replace(`?${params.toString()}`);
  };
  const handleOpenCreateModal = () => {
    setEditingUser(null); // Limpa o usuário em edição (modo de criação)
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user: Usuario) => {
    setEditingUser(user); // Define o usuário para edição
    setIsFormModalOpen(true);
  };
  
  // Função de callback para o sucesso do formulário
  const handleFormSuccess = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleOpenDeleteDialog = (user: Usuario) => {
    setUserToDelete(user);
    setDialogOpen(true);
  };

  // Fecha o diálogo e limpa os dados do usuário
  const handleCloseDeleteDialog = () => {
    setDialogOpen(false);
    setUserToDelete(null);
  };

  // Executa a exclusão quando o usuário confirma no diálogo
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const result = await deleteUser(userToDelete.id);
    
    setSnackbarMessage(result.message);
    setSnackbarSeverity(result.success ? 'success' : 'error');
    setSnackbarOpen(true);

    handleCloseDeleteDialog(); // Fecha o diálogo após a ação
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // A página atual é lida da URL. O componente de paginação é 0-indexado.
  const page = (Number(searchParams.get('page')) || 1) - 1;

  // A função para mudar de página permanece a mesma
  const handleChangePage = (event: unknown, newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', (newPage + 1).toString());
    router.push(`?${params.toString()}`);
  };

  const handleEdit = (id: string) => console.log(`Editar usuário com ID: ${id}`);
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
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pesquisar por nome..."
            // Define o valor padrão com base na URL, para que a busca persista no refresh
            defaultValue={searchParams.get('query') || ''}
            onChange={(e) => {
              // Lógica de debouncing: espera 300ms antes de buscar
              const timeoutId = setTimeout(() => {
                handleSearch(e.target.value);
              }, 300);
              // Limpa o timeout anterior se o usuário continuar digitando
              return () => clearTimeout(timeoutId);
            }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
              sx: { borderRadius: '20px', fontSize: '0.875rem' }
            }}
          />
          <IconButton title="Filtrar lista"><FilterListIcon /></IconButton>
          <Button variant="contained" onClick={handleOpenCreateModal}  startIcon={<AddIcon />} sx={{ bgcolor: '#d1717c', borderRadius: '20px', px: 3, textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#b55a66' } }}>
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
                <TableCell sx={{ fontWeight: 'bold' }}>Autor</TableCell>

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
                  <TableCell>
                    {user.autor && <Chip label="Autor" size="small" sx={{ bgcolor: '#d1717c', color: 'white', fontWeight: 'bold' }} />}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEditModal(user)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenDeleteDialog(user)}><DeleteIcon fontSize="small" /></IconButton>
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

      <Snackbar open={snackbarOpen} autoHideDuration={1000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirmar Exclusão"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja deletar permanentemente o usuário 
            <strong>{` ${userToDelete?.nome || ''}`}</strong>? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} autoFocus color="error">
            Deletar
          </Button>
        </DialogActions>
      </Dialog>

      {isFormModalOpen && (
        <UserFormModal
          open={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleFormSuccess}
          editingUser={editingUser}
        />
      )}

    </Box>
  );
}