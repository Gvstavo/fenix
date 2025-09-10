'use client';
import { useEffect,useActionState } from 'react';
import {useFormStatus } from 'react-dom';
import { Modal, TextField, Typography, Fade, Box, Button } from '@mui/material';
import { registerUser, type SignUpState } from '@/actions/auth';

// Componente para o botão de submit que mostra o estado de pendente
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      fullWidth
      variant="contained"
      disabled={pending}
      sx={{ 
        mt: 3, 
        mb: 2, 
        backgroundColor: '#d1717c',
        '&:hover': { backgroundColor: '#c1616c' }
      }}
    >
      {pending ? 'Cadastrando...' : 'Cadastrar'}
    </Button>
  );
}

interface SignUpModalProps {
  open: boolean;
  onClose: () => void;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #d1717c',
  borderRadius: '16px',
  boxShadow: 24,
  p: 4,
};

export function SignUpModal({ open, onClose }: SignUpModalProps) {
  const initialState: SignUpState = { message: '', success: false };
  const [state, formAction] = useActionState(registerUser, initialState);

  // Efeito para fechar o modal e mostrar alerta em caso de sucesso
  useEffect(() => {
    if (state.success) {
      alert(state.message); // Você pode substituir por um Toast/Snackbar
      onClose();
    }
  }, [state, onClose]);

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 2, color: '#d1717c', fontWeight: 'bold' }}>
            Criar Nova Conta
          </Typography>
          {/* O form agora usa a Server Action */}
          <form action={formAction}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="name" // O atributo 'name' é essencial para Server Actions
              label="Nome de Usuário"
              autoComplete="name"
              error={!!state.errors?.name}
              helperText={state.errors?.name?.[0]}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label="Endereço de E-mail"
              autoComplete="email"
              error={!!state.errors?.email}
              helperText={state.errors?.email?.[0]}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              autoComplete="new-password"
              error={!!state.errors?.password}
              helperText={state.errors?.password?.[0]}
            />
            
            {/* Mensagem de erro geral */}
            {!state.success && state.message && !state.errors && (
               <Typography color="error" sx={{ mt: 2 }}>{state.message}</Typography>
            )}

            <SubmitButton />
          </form>
        </Box>
      </Fade>
    </Modal>
  );
}