'use client';
import { useEffect } from 'react';
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, 
  CircularProgress, Box, Typography, Alert
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { createPaginasFromZip } from '@/actions/pagina.ts'; // Action do seu arquivo pagina.ts
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface PaginaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  capituloId: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      sx={{
        bgcolor: '#d1717c',
        '&:hover': { bgcolor: '#b55a66' },
      }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Importar ZIP'}
    </Button>
  );
}

export function PaginaCreateModal({ open, onClose, onSuccess, capituloId }: PaginaCreateModalProps) {
  // Bind do ID do capítulo para a server action
  const createAction = createPaginasFromZip.bind(null, capituloId);
  const [state, formAction] = useActionState(createAction, { success: false, message: '' });

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      onClose();
    }
  }, [state, onClose, onSuccess]);

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction }}>
      <DialogTitle>Importar Páginas em Lote</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          <Alert severity="warning">
            Atenção: O envio de um arquivo ZIP processará as imagens baseadas na numeração (ex: 1.webp, 2.jpg). 
            Registros preexistentes com o mesmo número serão substituídos ou duplicados dependendo da regra do banco.
          </Alert>

          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{ color: '#d1717c', borderColor: 'rgba(209, 113, 124, 0.5)', p: 2, borderStyle: 'dashed' }}
          >
            Selecionar Arquivo .ZIP
            <input
              type="file"
              name="zipfile"
              hidden
              accept=".zip"
              required
            />
          </Button>

          {/* Feedback de erro do servidor */}
          {!state.success && state.message && (
             <Typography color="error" variant="body2">{state.message}</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button sx={{ color: '#d1717c' }} onClick={onClose}>Cancelar</Button>
        <SubmitButton />
      </DialogActions>
    </Dialog>
  );
}