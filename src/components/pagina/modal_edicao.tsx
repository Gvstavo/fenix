'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, 
  CircularProgress, Box, Typography, TextField, Link as MuiLink
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { updatePagina } from '@/actions/pagina.ts'; // Action do arquivo pagina.ts
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getPresignedUrl } from '@/actions/minio'; // Assumindo que essa func existe baseada no modal.tsx original

// Interface local
interface Pagina {
  id: number;
  capitulo_id: number;
  numero: number;
  url: string;
}

interface PaginaEditModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  pagina: Pagina;
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
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Salvar Alterações'}
    </Button>
  );
}

export function PaginaEditModal({ open, onClose, onSuccess, pagina }: PaginaEditModalProps) {
  // Bind do ID da página para a server action
  const updateAction = updatePagina.bind(null, pagina.id);
  const [state, formAction] = useActionState(updateAction, { success: false, message: '' });
  
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Busca URL assinada apenas para criar o link externo
  useEffect(() => {
    if (open && pagina.url) {
      const fetchUrl = async () => {
        try {
           // Assume que a key 'mangas' é o bucket padrão usado no modal.tsx
           const url = await getPresignedUrl('mangas', pagina.url);
           setImagePreviewUrl(url);
        } catch (e) {
           console.error("Erro ao gerar URL", e);
        }
      };
      fetchUrl();
    }
  }, [open, pagina]);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      onClose();
    }
  }, [state, onClose, onSuccess]);

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction }}>
      <DialogTitle>Editar Página</DialogTitle>
      <DialogContent>
        
        {/* Campo Número (Nota: O backend precisa ser ajustado para ler este campo) */}
        <TextField
          autoFocus
          margin="dense"
          name="numero"
          label="Número da Página"
          type="number"
          fullWidth
          defaultValue={pagina.numero}
          helperText="Ajuste a ordem da página"
        />

        {/* Link para visualização da imagem atual (externo) */}
        <Box mt={2} mb={2} display="flex" alignItems="center" gap={1}>
           <Typography variant="body2">Imagem Atual:</Typography>
           {imagePreviewUrl ? (
             <Button 
               component={MuiLink} 
               href={imagePreviewUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               endIcon={<OpenInNewIcon />}
               size="small"
               sx={{ textTransform: 'none' }}
             >
               Abrir em nova guia
             </Button>
           ) : (
             <Typography variant="caption" color="text.secondary">Carregando link...</Typography>
           )}
        </Box>

        {/* Upload de Nova Imagem (Substituição) */}
        <Box mb={2}>
          <Button
            variant="outlined"
            component="label"
            sx={{ color: '#d1717c', borderColor: 'rgba(209, 113, 124, 0.5)', width: '100%' }}
          >
            Substituir Imagem (.webp)
            <input
              type="file"
              hidden
              name="image"
              accept="image/webp, image/jpeg, image/png"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileName(e.target.files[0].name);
                } else {
                  setFileName(null);
                }
              }}
            />
          </Button>
          {fileName && (
            <Typography variant="caption" display="block" mt={1}>
              Arquivo selecionado: {fileName}
            </Typography>
          )}
        </Box>

        {!state.success && state.message && (
             <Typography color="error" variant="body2">{state.message}</Typography>
        )}

      </DialogContent>
      <DialogActions>
        <Button sx={{ color: '#d1717c' }} onClick={onClose}>Cancelar</Button>
        <SubmitButton />
      </DialogActions>
    </Dialog>
  );
}