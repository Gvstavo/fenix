'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Toolbar, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, type AlertColor
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { deletePagina } from '@/actions/pagina.ts'; // Importe suas actions
import { PaginaCreateModal } from './modal_criacao.tsx';
import { PaginaEditModal } from './modal_edicao.tsx';

// Interface inferida (ajuste conforme seu src/models.tsx)
interface Pagina {
  id: number;
  capitulo_id: number;
  numero: number;
  url: string;
}

interface PaginaTableProps {
  paginas: Pagina[];
  capituloId: number;
  mangaSlug: string; // Para o botão de voltar ou navegação
}

export function PaginasTable({ paginas, capituloId, mangaSlug }: PaginaTableProps) {
  const router = useRouter();
  
  // Estados de Interface
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');
  
  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados de Dados
  const [editingPagina, setEditingPagina] = useState<Pagina | null>(null);
  const [paginaToDelete, setPaginaToDelete] = useState<Pagina | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Ordenação descendente por número (Client-side, já que recebemos a lista)
  const sortedPaginas = useMemo(() => {
    return [...paginas].sort((a, b) => b.numero - a.numero);
  }, [paginas]);

  // Handlers de Sucesso
  const handleFormSuccess = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Delete Handlers
  const handleOpenDeleteDialog = (pagina: Pagina) => {
    setPaginaToDelete(pagina);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPaginaToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!paginaToDelete) return;
    
    // Chama a server action importada de pagina.ts
    const result = await deletePagina(paginaToDelete.id);
    
    setSnackbarMessage(result.message);
    setSnackbarSeverity(result.success ? 'success' : 'error');
    setSnackbarOpen(true);
    handleCloseDeleteDialog();
  };

  // Edit Handlers
  const handleOpenEditModal = (pagina: Pagina) => {
    setEditingPagina(pagina);
    setIsEditModalOpen(true);
  };

  return (
    <Box>
      <Toolbar sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          borderRadius: 2,
          mb: 2,
          boxShadow: 1
        }} 
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
           </IconButton>
           <Typography sx={{ fontWeight: 'bold' }} variant="h6" component="div">
            Gerenciar Páginas (Capítulo {capituloId})
          </Typography>
        </Box>

        <Button 
          variant="contained" 
          onClick={() => setIsCreateModalOpen(true)}
          startIcon={<AddIcon />} 
          sx={{ 
            bgcolor: '#d1717c', 
            borderRadius: '20px', 
            px: 3, 
            textTransform: 'none', 
            fontWeight: 'bold', 
            '&:hover': { bgcolor: '#b55a66' } 
          }}
        >
          Importar ZIP
        </Button>
      </Toolbar>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: 1 }}>
        <TableContainer>
          <Table stickyHeader aria-label="Tabela de Páginas">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPaginas.map((pagina) => (
                <TableRow key={pagina.id}>
                  <TableCell>{pagina.numero}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEditModal(pagina)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDeleteDialog(pagina)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {sortedPaginas.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">Nenhuma página encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbar de Feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Dialog de Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar a página número <strong>{paginaToDelete?.numero}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} autoFocus color="error">Deletar</Button>
        </DialogActions>
      </Dialog>

      {/* Modais */}
      {isCreateModalOpen && (
        <PaginaCreateModal 
          open={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={handleFormSuccess}
          capituloId={capituloId}
        />
      )}

      {isEditModalOpen && editingPagina && (
        <PaginaEditModal 
          open={isEditModalOpen} 
          onClose={() => { setIsEditModalOpen(false); setEditingPagina(null); }} 
          onSuccess={handleFormSuccess}
          pagina={editingPagina}
        />
      )}
    </Box>
  );
}