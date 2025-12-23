'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, 
  CircularProgress, Box, Typography, Alert
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { createPaginasFromZip } from '@/actions/pagina'; // Removido .ts da importação (padrão Next.js)
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface PaginaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  capituloId: number;
}

// O botão de submit usa useFormStatus para saber se ESTE formulário específico está enviando
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending} // Desabilita o botão durante o envio
      sx={{
        bgcolor: '#d1717c',
        '&:hover': { bgcolor: '#b55a66' },
        minWidth: '140px' // Garante que o tamanho não mude drasticamente com o spinner
      }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Importar ZIP'}
    </Button>
  );
}

export function PaginaCreateModal({ open, onClose, onSuccess, capituloId }: PaginaCreateModalProps) {
  const createAction = createPaginasFromZip.bind(null, capituloId);
  
  // React 19: useActionState retorna [state, action, isPending]
  // isPending é true enquanto a server action está rodando
  const [state, formAction, isPending] = useActionState(createAction, { success: false, message: '' });
  
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      // Pequeno delay ou reset antes de fechar para evitar flash visual, se desejar
      onClose();
    }
    
    // Reseta se fechar ou se tiver sucesso
    if (!open || state.success) {
        setFileName(null);
    }
  }, [state, onClose, onSuccess, open]);

  return (
    <Dialog 
      open={open} 
      onClose={(e, reason) => {
        // Impede fechar o modal clicando fora ou com ESC se estiver enviando
        if (isPending && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
           return;
        }
        onClose();
      }}
      PaperProps={{ component: 'form', action: formAction }}
    >
      <DialogTitle>Importar Páginas em Lote</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          <Alert severity="warning">
            Atenção: O envio de um arquivo ZIP <strong>apagará todas as páginas existentes</strong> neste capítulo e as substituirá pelo conteúdo do arquivo.
          </Alert>

          <Button
            component="label"
            variant="outlined"
            disabled={isPending} // Bloqueia troca de arquivo durante upload
            startIcon={<CloudUploadIcon />}
            sx={{ 
              color: '#d1717c', 
              borderColor: 'rgba(209, 113, 124, 0.5)', 
              p: 2, 
              borderStyle: 'dashed',
              opacity: isPending ? 0.6 : 1 
            }}
          >
            {fileName ? 'Trocar Arquivo ZIP' : 'Selecionar Arquivo .ZIP'}
            <input
              type="file"
              name="zipfile"
              hidden
              accept=".zip"
              required
              disabled={isPending} // Garante que o input também fique desabilitado
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFileName(e.target.files[0].name);
                } else {
                  setFileName(null);
                }
              }}
            />
          </Button>

          {fileName && (
            <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                <InsertDriveFileIcon color="action" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
                    {fileName}
                </Typography>
            </Box>
          )}

          {/* Feedback de erro do servidor */}
          {!state.success && state.message && (
             <Typography color="error" variant="body2">{state.message}</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {/* Desabilita o botão Cancelar durante o envio */}
        <Button sx={{ color: '#d1717c' }} onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <SubmitButton />
      </DialogActions>
    </Dialog>
  );
}