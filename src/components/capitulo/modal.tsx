'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
  CircularProgress, Box, Typography
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { type Capitulo, type Manga } from '@/src/models.tsx'
import { type FormState, createCapitulo, updateCapitulo } from '@/actions/capitulo.ts';
import { getPresignedUrl } from '@/actions/minio.ts';
// REMOVIDO: import Image from 'next/image'; -> Causa erro com blob urls

interface CapituloFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingCapitulo: Capitulo | null;
  manga: Manga;
}

// Botão de submit
function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  // O hook useFormStatus precisa estar dentro de um componente renderizado DENTRO do <form>
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      sx={{
        minWidth: 150,
        bgcolor: '#d1717c',
        '&:hover': {
          bgcolor: '#b55a66',
        },
        '&.Mui-disabled': {
          bgcolor: 'rgba(0, 0, 0, 0.12)',
          color: 'rgba(0, 0, 0, 0.26)' 
        },
      }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Capítulo')}
    </Button>
  );
}

export function CapituloFormModal({ open, onClose, onSuccess, editingCapitulo, manga }: CapituloFormModalProps) {
  const isEditMode = Boolean(editingCapitulo);
  const initialState: FormState = { message: '', success: false };
  const action = isEditMode ? updateCapitulo : createCapitulo;
  const [state, formAction] = useActionState(action, initialState);
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      onClose();
    }
  }, [state, onClose, onSuccess]);

  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setFileName(null);
      return;
    }
    // Busca a URL se estiver em modo de edição e houver um thumbnail
    if (isEditMode && editingCapitulo?.thumbnail) {
      const fetchImageUrl = async () => {
        try {
          const url = await getPresignedUrl('mangas', editingCapitulo.thumbnail);
          setImageUrl(url);
        } catch (error) {
          console.error(error);
          setImageUrl(null);
        }
      };
      fetchImageUrl();
    }
  }, [open, editingCapitulo, isEditMode]);


  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction }}>
      <DialogTitle>{isEditMode ? 'Editar Capítulo' : 'Criar Novo Capítulo'}</DialogTitle>
      <DialogContent>
        {isEditMode && <input type="hidden" name="id" value={editingCapitulo.id} />}
        <input type="hidden" name="manga_id" value={manga.id} />
        <input type="hidden" name="manga_slug" value={manga.slug} />
        
        <TextField
          autoFocus
          required
          margin="dense"
          name="titulo"
          label="Título"
          type="text"
          fullWidth
          defaultValue={isEditMode ? editingCapitulo.titulo : ''}
          error={!!state.errors?.titulo}
          helperText={state.errors?.titulo?.[0]}
        />

        <TextField
          required
          margin="dense"
          name="numero"
          label="Número"
          type="number"
          fullWidth
          defaultValue={isEditMode ? editingCapitulo.numero : ''}
          error={!!state.errors?.ano}
          helperText={state.errors?.ano?.[0]}
        />

        {/* Upload de Imagem */}
        <Box my={2}>
           {/* CORREÇÃO: Usando tag <img> padrão em vez de Next Image */}
           {imageUrl && (
              <Box mb={2} sx={{ textAlign: 'center' }}>
                 <img 
                    src={imageUrl} 
                    alt="Thumbnail atual" 
                    style={{ 
                       maxWidth: '100%', 
                       maxHeight: '200px', 
                       borderRadius: '8px',
                       objectFit: 'contain' 
                    }} 
                 />
              </Box>
           )}

           <Button
              variant="outlined"
              component="label"
              sx={{ color: '#d1717c', borderColor: 'rgba(209, 113, 124, 0.5)' }}
           >
              {isEditMode ? 'Alterar Thumbnail' : 'Selecionar Thumbnail'} (.webp)
              <input
                 type="file"
                 hidden
                 name="thumbnail"
                 accept="image/webp"
                 required={!isEditMode}
                 onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                       const file = e.target.files[0];
                       setFileName(file.name);
                       // Cria URL blob segura para <img>, mas que quebraria <Image />
                       setImageUrl(URL.createObjectURL(file)); 
                    } else {
                       setFileName(null);
                    }
                 }}
              />
           </Button>
           
           {(fileName || (isEditMode && editingCapitulo?.thumbnail)) && (
              <Typography variant="body2" component="span" ml={2}>
                 {fileName ?? editingCapitulo?.thumbnail?.split('/').pop()}
              </Typography>
           )}
           
           {state.errors?.thumbnail && (
              <Typography variant="body2" color="error" mt={1}>
                 {state.errors.thumbnail[0]}
              </Typography>
           )}
        </Box>

      </DialogContent>
      <DialogActions>
         {/* Adicionado CancelButton wrapper ou disabled simples para evitar fechar durante envio */}
         <Button sx={{ color: '#d1717c' }} onClick={onClose}>Cancelar</Button>
         <SubmitButton isEditMode={isEditMode} />
      </DialogActions>
    </Dialog>
  );
}