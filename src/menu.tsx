'use client';
import type { FC } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Box, 
    Button, 
    InputBase,
    // NOVO: Adicionado para os ícones
    IconButton 
} from '@mui/material';
import { styled, alpha, Theme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Image from 'next/image';
import Link from 'next/link';

// --- NOVOS ÍCONES ---
// O MUI não tem o ícone do Discord. Usei o ForumIcon como substituto.
// Para usar o ícone real, você pode usar um SVG customizado ou uma biblioteca como a 'react-icons'.
import ForumIcon from '@mui/icons-material/Forum'; 
import FacebookIcon from '@mui/icons-material/Facebook';
import TelegramIcon from '@mui/icons-material/Telegram';
// --- Estilos existentes (sem alterações) ---
const Search = styled('div')(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.common.white, 0.25),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.35),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }: { theme: Theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// --- Componente Principal ---
const Header: FC = () => {
  const navItems = ['Início', 'Projetos', 'Novels', 'Concluídos'];

  return (
    // Adicionado React Fragment para agrupar o AppBar e a nova barra social
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(to right, #d1717c, #f0c382)',
          // Remove a sombra padrão para que a sombra da barra de baixo se destaque
          borderBottom: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/" passHref>
              <Image 
                src="/logo-superior-fenix.webp"
                alt="Fênix Project Logo" 
                width={180}
                height={50}
                style={{ objectFit: 'contain' }}
              />
            </Link>
          </Box>

          {/* Links de Navegação */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            {navItems.map((item) => (
              <Button 
                key={item} 
                sx={{ 
                  color: 'white', 
                  mx: 1, 
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {item}
              </Button>
            ))}
          </Box>

          {/* Barra de Busca e Botões de Autenticação */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Procurar…"
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>

            <Button 
              color="inherit" 
              sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  marginRight: '10px'
              }}
            >
              Entrar
            </Button>
            <Button 
              variant="contained"
              sx={{
                backgroundColor: '#d1717c',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                borderRadius: '20px',
                px: 3,
                '&:hover': {
                  backgroundColor: '#c1616c'
                }
              }}
            >
              Cadastrar
            </Button>
          </Box>
        </Toolbar>
      </AppBar>


      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          py: 0.5, // Padding vertical
          backgroundColor: 'white',
          boxShadow: '0px 4px 12px -2px #d1717c',
        }}
      >
        <IconButton 
          aria-label="Discord" 
          component="a" 
          href="https://discord.com/invite/Ctx4zWh6c3" // Substitua pelo seu link
          target="_blank"
        >
          <ForumIcon sx={{ color: 'text.secondary' }} />
        </IconButton>

        <IconButton 
          aria-label="Telegram" 
          component="a" 
          href="https://t.me/+NKlzjjfDzG8wNGEx" // Substitua pelo seu link
          target="_blank"
        >
          <TelegramIcon sx={{ color: 'text.secondary' }} />
        </IconButton>
        
        <IconButton 
          aria-label="Facebook" 
          component="a" 
          href="https://facebook.com/people/Fênix-Project/61554993070163/" // Substitua pelo seu link
          target="_blank"
        >
          <FacebookIcon sx={{ color: 'text.secondary' }} />
        </IconButton>
      </Box>
    </>
  );
};

export default Header;