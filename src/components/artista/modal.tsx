'use client';
import { useEffect } from 'react';
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
  FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { type Artista } from '@/src/models.tsx';
import { type FormState, createArtista, updateArtista } from '@/actions/artista.tsx';

interface ArtistFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingArtist: Artista | null; // Se for null, é modo de criação
}

// Botão de submit que mostra o estado de loading
function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      // --- ALTERAÇÃO 1: Adiciona a cor customizada ao botão ---
      sx={{
        bgcolor: '#d1717c',
        '&:hover': {
          bgcolor: '#b55a66', // Um tom mais escuro para o efeito hover
        },
      }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Artista')}
    </Button>
  );
}

export function ArtistFormModal({ open, onClose, onSuccess, editingArtist }: ArtistFormModalProps) {
  const isEditMode = Boolean(editingArtist);
  const initialState: FormState = { message: '', success: false };

  // Escolhe a ação correta e anexa o ID se estiver no modo de edição
  const action = isEditMode ? updateArtista : createArtista;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      onClose();
    }
  }, [state, onClose, onSuccess]);

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction }}>
      <DialogTitle>{isEditMode ? 'Editar Artista' : 'Criar Novo Artista'}</DialogTitle>
      <DialogContent>
        {/* Campo oculto para o ID no modo de edição */}
        {isEditMode && <input type="hidden" name="id" value={editingArtist.id} />}
        
        <TextField
          autoFocus
          required
          margin="dense"
          name="nome"
          label="Nome"
          type="text"
          fullWidth
          defaultValue={isEditMode ? editingArtist.nome : ''}
          error={!!state.errors?.nome}
          helperText={state.errors?.nome?.[0]}
        />

      </DialogContent>
      <DialogActions>
        <Button  sx={{ color: '#d1717c' }} onClick={onClose}>Cancelar</Button>
        <SubmitButton isEditMode={isEditMode} />
      </DialogActions>
    </Dialog>
  );
}