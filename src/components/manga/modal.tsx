'use client';
import { useEffect, useState } from 'react'; // Adicionado useState
import { useActionState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
  FormControlLabel, Checkbox, CircularProgress, Box, Typography,
  Chip, Autocomplete
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import {type Autor, type Genero, type Artista, type Manga} from '@/src/models.tsx'
import { type FormState, createManga, updateManga } from '@/actions/manga';
import { getPresignedUrl } from '@/actions/minio.ts';


interface MangaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingManga: Manga | null;
  autores: Autor[];
  artistas: Artista[];
  generos: Genero [];
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
        bgcolor: '#d1717c',
        '&:hover': {
          bgcolor: '#b55a66',
        },
      }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Mangá')}
    </Button>
  );
}

export function MangaFormModal({ open, onClose, onSuccess, editingManga,autores,artistas,generos  }: MangaFormModalProps) {
  const isEditMode = Boolean(editingManga);
  const initialState: FormState = { message: '', success: false };
  const action = isEditMode ? updateManga : createManga;
  const [state, formAction] = useActionState(action, initialState);
  
  // Estado local para exibir o nome do arquivo selecionado
  const [fileName, setFileName] = useState<string | null>(null);

  const [selectedAutores, setSelectedAutores] = useState<Autor[]>(() => 
    isEditMode ? autores.filter(a => editingManga.autores.includes(a.id)) : []
  );
  const [selectedArtistas, setSelectedArtistas] = useState<Artista[]>(() => 
    isEditMode ? artistas.filter(a => editingManga.artistas.includes(a.id)) : []
  );
  const [selectedGeneros, setSelectedGeneros] = useState<Genero[]>(() => 
    isEditMode ? generos.filter(g => editingManga.generos.includes(g.id)) : []
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null); // <-- 2. Estado para a URL da imagem

  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      return;
    }

    // Busca a URL se estiver em modo de edição e houver um thumbnail
    if (isEditMode && editingManga?.thumbnail) {
      const fetchImageUrl = async () => {
        try {
          // Chama a Server Action com o nome do bucket e a chave do objeto
          const url = await getPresignedUrl('mangas', editingManga.thumbnail);
          setImageUrl(url);
        } catch (error) {
          console.error(error);
          setImageUrl(null); // Limpa em caso de erro
        }
      };
      fetchImageUrl();
    }
  }, [open, editingManga, isEditMode]);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.message);
      onClose();
    }
    if (!open) {
      setFileName(null);
      // Reseta os campos ao fechar
      setSelectedAutores(isEditMode ? autores.filter(a => editingManga.autores.includes(a.id)) : []);
      setSelectedArtistas(isEditMode ? artistas.filter(a => editingManga.artistas.includes(a.id)) : []);
      setSelectedGeneros(isEditMode ? generos.filter(g => editingManga.generos.includes(g.id)) : []);
    }
  }, [state, open, onClose, onSuccess, editingManga, autores, artistas, generos, isEditMode]);
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', action: formAction}}>
      <DialogTitle>{isEditMode ? 'Editar Mangá' : 'Criar Novo Mangá'}</DialogTitle>
      <DialogContent>
        {/* Campo oculto para o ID no modo de edição */}
        {isEditMode && <input type="hidden" name="id" value={editingManga.id} />}
        
        {/* Título */}
        <TextField
          autoFocus
          required
          margin="dense"
          name="titulo"
          label="Título"
          type="text"
          fullWidth
          defaultValue={isEditMode ? editingManga.titulo : ''}
          error={!!state.errors?.titulo}
          helperText={state.errors?.titulo?.[0]}
        />

        {/* Ano */}
        <TextField
          required
          margin="dense"
          name="ano"
          label="Ano de lançamento"
          type="number"
          fullWidth
          defaultValue={isEditMode ? editingManga.ano : ''}
          error={!!state.errors?.ano}
          helperText={state.errors?.ano?.[0]}
        />


        <Autocomplete
          multiple
          required
          options={autores}
          getOptionLabel={(option) => option.nome}
          value={selectedAutores}
          onChange={(event, newValue) => {
            setSelectedAutores(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              label="Autores"
              placeholder="Selecione um ou mais autores"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              // Separa a 'key' do resto das props
              const { key, ...chipProps } = getTagProps({ index });
              return (
                <Chip
                  key={key} // Aplica a key diretamente
                  variant="outlined"
                  label={option.nome}
                  {...chipProps} // Faz o spread do resto
                />
              );
            })
          }
        />

        {/* Artistas */}
        <Autocomplete
          multiple
          required
          options={artistas}
          getOptionLabel={(option) => option.nome}
          value={selectedArtistas}
          onChange={(event, newValue) => {
            setSelectedArtistas(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              label="Artistas"
              placeholder="Selecione um ou mais artistas"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              // Separa a 'key' do resto das props
              const { key, ...chipProps } = getTagProps({ index });
              return (
                <Chip
                  key={key} // Aplica a key diretamente
                  variant="outlined"
                  label={option.nome}
                  {...chipProps} // Faz o spread do resto
                />
              );
            })
          }
        />

        {/* Gêneros */}
        <Autocomplete
          multiple
          required
          options={generos}
          getOptionLabel={(option) => option.nome}
          value={selectedGeneros}
          onChange={(event, newValue) => {
            setSelectedGeneros(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              label="Gêneros"
              placeholder="Selecione um ou mais gêneros"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              // Separa a 'key' do resto das props
              const { key, ...chipProps } = getTagProps({ index });
              return (
                <Chip
                  key={key} // Aplica a key diretamente
                  variant="outlined"
                  label={option.nome}
                  {...chipProps} // Faz o spread do resto
                />
              );
            })
          }
        />


        <input 
          type="hidden" 
          name="autores" 
          value={selectedAutores.map(autor => autor.id).join(',')} 
        />
        <input 
          type="hidden" 
          name="artistas" 
          value={selectedArtistas.map(artista => artista.id).join(',')} 
        />
        <input 
          type="hidden" 
          name="generos" 
          value={selectedGeneros.map(genero => genero.id).join(',')} 
        />



        {/* Sinopse */}
        <TextField
          required
          margin="dense"
          name="sinopse"
          label="Sinopse"
          type="text"
          fullWidth
          multiline
          rows={4}
          defaultValue={isEditMode ? editingManga.sinopse : ''}
          error={!!state.errors?.sinopse}
          helperText={state.errors?.sinopse?.[0]}
        />

        {/* Upload de Imagem */}
        <Box my={2}>
            {/* 4. Exibição da imagem atual (preview) */}
            {isEditMode && imageUrl && (
                <Box mb={2} sx={{ textAlign: 'center' }}>
                    <img 
                        src={imageUrl} 
                        alt="Thumbnail atual" 
                        style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '8px' }}
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
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </Button>
          { (fileName || (isEditMode && editingManga.thumbnail)) && (
            <Typography variant="body2" component="span" ml={2}>
              {fileName ?? editingManga.thumbnail.split('/').pop()}
            </Typography>
          )}
          { state.errors?.thumbnail && (
            <Typography variant="body2" color="error" mt={1}>
              {state.errors.thumbnail[0]}
            </Typography>
          )}
        </Box>
        
        {/* Checkboxes */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                name="adulto"
                defaultChecked={isEditMode ? editingManga.adulto : false}
                sx={{ '&.Mui-checked': { color: '#d1717c' } }}
              />
            }
            label="Conteúdo Adulto"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="finalizado"
                defaultChecked={isEditMode ? editingManga.finalizado : false}
                sx={{ '&.Mui-checked': { color: '#d1717c' } }}
              />
            }
            label="Finalizado"
          />
        </Box>

      </DialogContent>
      <DialogActions>
        <Button sx={{ color: '#d1717c' }} onClick={onClose}>Cancelar</Button>
        <SubmitButton isEditMode={isEditMode} />
      </DialogActions>
    </Dialog>
  );
}