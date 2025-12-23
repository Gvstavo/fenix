'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Toolbar, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, type AlertColor, TextField, InputAdornment, TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { deletePagina } from '@/actions/pagina'; 
import { PaginaCreateModal } from './modal_criacao';
import { PaginaEditModal } from './modal_edicao';

interface Pagina {
  id: number;
  capitulo_id: number;
  numero: number;
  url: string;
}

interface PaginaTableProps {
  paginas: Pagina[];
  totalCount: number; // Adicionado totalCount
  capituloId: number;
  mangaSlug: string;
}

// Constante igual ao backend
const ITEMS_PER_PAGE = 10

export function PaginasTable({ paginas, totalCount, capituloId, mangaSlug,capituloInfo }: PaginaTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // --- Lógica de Busca e Paginação (Igual CapitulosTable) ---
  
  const page = (Number(searchParams.get('page')) || 1) - 1;

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reseta para primeira página na busca
    
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    
    router.replace(`?${params.toString()}`);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (newPage + 1).toString());
    router.push(`?${params.toString()}`);
  };
  // -----------------------------------------------------------

  const handleFormSuccess = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

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
    
    const result = await deletePagina(paginaToDelete.id);
    
    setSnackbarMessage(result.message);
    setSnackbarSeverity(result.success ? 'success' : 'error');
    setSnackbarOpen(true);
    handleCloseDeleteDialog();
  };

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
        <Typography sx={{ fontWeight: 'bold' }} variant="h6" component="div">
           Capítulo {capituloInfo.numero} - {capituloInfo.titulo}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
           {/* Campo de Busca */}
           <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar número..."
            defaultValue={searchParams.get('query') || ''}
            onChange={(e) => {
              const timeoutId = setTimeout(() => {
                handleSearch(e.target.value);
              }, 300);
              return () => clearTimeout(timeoutId);
            }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
              sx: { borderRadius: '20px', fontSize: '0.875rem' }
            }}
          />
          <IconButton title="Filtrar lista"><FilterListIcon /></IconButton>

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
        </Box>
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
              {paginas.map((pagina) => (
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
              {paginas.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">Nenhum resultado encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginação Server-Side */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={ITEMS_PER_PAGE}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

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