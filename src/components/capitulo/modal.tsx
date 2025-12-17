'use client';
import { useEffect, useState } from 'react'; // Adicionado useState
import { useActionState } from 'react';
import {
   Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
   FormControlLabel, Checkbox, CircularProgress, Box, Typography,
   Chip, Autocomplete
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { type Capitulo, type Manga} from '@/src/models.tsx'
import { type FormState, createCapitulo, updateCapitulo } from '@/actions/capitulo.ts';
import { getPresignedUrl } from '@/actions/minio.ts';
import Image from 'next/image';

interface CapituloFormModalProps {
   open: boolean;
   onClose: () => void;
   onSuccess: (message: string) => void;
   editingCapitulo: Capitulo | null;
   manga: Manga;
}

// Botão de submit que mostra o estado de loading
function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
   const { pending } = useFormStatus();
   return (
      <Button
         type="submit"
         variant="contained"
         disabled={pending}
         sx={{
            minWidth: 150, // Define uma largura mínima para não mudar de tamanho
            bgcolor: '#d1717c',
            '&:hover': {
               bgcolor: '#b55a66',
            },
            // Estilo para quando o botão estiver desabilitado (pending)
            '&.Mui-disabled': {
               bgcolor: 'grey.400',
            },
         }}
      >
         {pending ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Capítulo')}
      </Button>
   );
}
export function CapituloFormModal({ open, onClose, onSuccess, editingCapitulo,manga  }: MangaFormModalProps) {
   const isEditMode = Boolean(editingCapitulo);
   const initialState: FormState = { message: '', success: false };
   const action = isEditMode ? updateCapitulo : createCapitulo;
   const [state, formAction] = useActionState(action, initialState);
   
   // Estado local para exibir o nome do arquivo selecionado
   const [fileName, setFileName] = useState<string | null>(null);

   const [imageUrl, setImageUrl] = useState<string | null>(null); // <-- 2. Estado para a URL da imagem
   useEffect(() => {
      if (state.success) {
         onSuccess(state.message);
         onClose();
      }
   }, [state, onClose, onSuccess]);
   useEffect(() => {
      if (!open) {
         setImageUrl(null);
         return;
      }
      // Busca a URL se estiver em modo de edição e houver um thumbnail
      if (isEditMode && editingCapitulo?.thumbnail) {
         const fetchImageUrl = async () => {
            try {
               // Chama a Server Action com o nome do bucket e a chave do objeto
               const url = await getPresignedUrl('mangas', editingCapitulo.thumbnail);
               setImageUrl(url);
            } catch (error) {
               console.error(error);
               setImageUrl(null); // Limpa em caso de erro
            }
         };
         fetchImageUrl();
      }
   }, [open, editingCapitulo, isEditMode]);


   return (
      <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction}}>
         <DialogTitle>{isEditMode ? 'Editar Capítulo' : 'Criar Novo Capítulo'}</DialogTitle>
         <DialogContent>
            {/* Campo oculto para o ID no modo de edição */}
            {isEditMode && <input type="hidden" name="id" value={editingCapitulo.id} />}
               <input type="hidden" name="manga_id" value={manga.id} />
            {/*    {!isEditMode && <input type="hidden" name="created_by" value={currentUserId} />}*/}
               <input type="hidden" name="manga_slug" value={manga.slug} />
            {/* Título */}
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

            {/* Ano */}
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
                  {/* 4. Exibição da imagem atual (preview) */}
           {isEditMode && imageUrl && (
               <Box mb={2} sx={{ position: 'relative', width: '100%', height: '200px', textAlign: 'center' }}>
                  <Image  
                     src={imageUrl}  
                     alt="Thumbnail atual" 
                     fill // A prop 'fill' faz a imagem preencher o container pai
                     style={{ objectFit: 'contain', borderRadius: '8px' }} // 'contain' para não cortar a imagem
                     sizes="(max-width: 600px) 100vw, 400px" // Ajuda na otimização de imagem responsiva
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
                     // Lógica opcional para preview do lado do cliente
                     if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setFileName(file.name);
                        setImageUrl(URL.createObjectURL(file)); // Cria uma URL temporária para preview
                     } else {
                        setFileName(null);
                     }
                  }}
               />
            </Button>
               { (fileName || (isEditMode && editingCapitulo.thumbnail)) && (
                  <Typography variant="body2" component="span" ml={2}>
                     {fileName ?? editingCapitulo.thumbnail.split('/').pop()}
                  </Typography>
               )}
               { state.errors?.thumbnail && (
                  <Typography variant="body2" color="error" mt={1}>
                     {state.errors.thumbnail[0]}
                  </Typography>
               )}
            </Box>
            
            {/* Checkboxes */}

         </DialogContent>
         <DialogActions>
            <Button sx={{ color: '#d1717c' }} onClick={onClose} >Cancelar</Button>
            <SubmitButton isEditMode={isEditMode} />
         </DialogActions>
      </Dialog>
   );
}