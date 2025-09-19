'use client';
import { useEffect } from 'react';
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
  FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { type Usuario } from '@/src/models.tsx';
import { type FormState, createUser, updateUser } from '@/actions/usuario.tsx';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingUser: Usuario | null; // Se for null, é modo de criação
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
      {pending ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Usuário')}
    </Button>
  );
}

export function UserFormModal({ open, onClose, onSuccess, editingUser }: UserFormModalProps) {
  const isEditMode = Boolean(editingUser);
  const initialState: FormState = { message: '', success: false };

  // Escolhe a ação correta e anexa o ID se estiver no modo de edição
  const action = isEditMode ? updateUser : createUser;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      onClose();
    }
  }, [state, onClose, onSuccess]);

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction }}>
      <DialogTitle>{isEditMode ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
      <DialogContent>
        {/* Campo oculto para o ID no modo de edição */}
        {isEditMode && <input type="hidden" name="id" value={editingUser.id} />}
        
        <TextField
          autoFocus
          required
          margin="dense"
          name="nome"
          label="Nome Completo"
          type="text"
          fullWidth
          defaultValue={isEditMode ? editingUser.nome : ''}
          error={!!state.errors?.nome}
          helperText={state.errors?.nome?.[0]}
        />
        <TextField
          required
          margin="dense"
          name="email"
          label="Endereço de E-mail"
          type="email"
          fullWidth
          defaultValue={isEditMode ? editingUser.email : ''}
          error={!!state.errors?.email}
          helperText={state.errors?.email?.[0]}
        />
        <TextField
          required={!isEditMode} // Senha só é obrigatória na criação
          margin="dense"
          name="senha"
          label="Senha"
          type="password"
          fullWidth
          placeholder={isEditMode ? "Deixe em branco para não alterar" : ""}
          error={!!state.errors?.senha}
          helperText={state.errors?.senha?.[0]}
        />
        <FormControlLabel
          control={
            <Checkbox
              defaultChecked={isEditMode ? editingUser.admin : false}
              name="admin"
              // --- ALTERAÇÃO 2: Adiciona a cor customizada ao checkbox ---
              sx={{
                '&.Mui-checked': {
                  color: '#d1717c',
                },
              }}
            />
          }
          label="Este usuário é um administrador"
        />
      </DialogContent>
      <DialogActions>
        <Button  sx={{ color: '#d1717c' }} onClick={onClose}>Cancelar</Button>
        <SubmitButton isEditMode={isEditMode} />
      </DialogActions>
    </Dialog>
  );
}