'use client';
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Exemplo, pode ser substituído
import PeopleIcon from '@mui/icons-material/People'; // Para "Usuários"
import SettingsIcon from '@mui/icons-material/Settings'; // Exemplo, pode ser substituído
import MenuIcon from '@mui/icons-material/Menu'; // Para o ícone do "Hamburger"
import LightModeIcon from '@mui/icons-material/LightMode'; // Para o tema claro
import NightsStayIcon from '@mui/icons-material/NightsStay'; // Para o tema escuro
import ColorLensIcon from '@mui/icons-material/ColorLens';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import CategoryIcon from '@mui/icons-material/Category';
import Link from 'next/link';

// Definição da largura da sidebar para consistência
const drawerWidth = 240;

export function AdminSidebar() {
  // Estado para controlar qual item da lista está selecionado
  const [selectedIndex, setSelectedIndex] = useState(1); // 'Usuários' como padrão

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
  };

  return (
    <Box 
      sx={{ 
        width: drawerWidth, 
        flexShrink: 0, 
        bgcolor: 'background.paper', // Fundo branco
        height: '100vh', // Ocupa a altura total da viewport
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Topo da Sidebar (Hamburger e Sitemark) */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, height: '64px' }}>
        <IconButton sx={{ mr: 1 }} color="inherit">
          
        </IconButton>
        <Typography variant="h6" noWrap component="div">
          Projeto Fênix
        </Typography>
      </Box>
      <Divider />

      {/* Main Items */}
      <List component="nav" sx={{ pt: 2 }}>
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
          Administração
        </Typography>
        <Link href="/admin/usuarios" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={selectedIndex === 1}
            onClick={(event) => handleListItemClick(event, 1)}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              '&.Mui-selected': { 
                bgcolor: '#d1717c',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': { bgcolor: '#c1616c' }
              },
              '&.Mui-selected:hover': {
                bgcolor: '#c1616c'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Usuários" />
          </ListItemButton>
        </Link>
        <Link href="/admin/artistas" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={selectedIndex === 2}
            onClick={(event) => handleListItemClick(event, 2)}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              '&.Mui-selected': { 
                bgcolor: '#d1717c',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': { bgcolor: '#c1616c' }
              },
              '&.Mui-selected:hover': {
                bgcolor: '#c1616c'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <ColorLensIcon />
            </ListItemIcon>
            <ListItemText primary="Artistas" />
          </ListItemButton>
        </Link>
        <Link href="/admin/autores" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={selectedIndex === 3}
            onClick={(event) => handleListItemClick(event, 3)}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              '&.Mui-selected': { 
                bgcolor: '#d1717c',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': { bgcolor: '#c1616c' }
              },
              '&.Mui-selected:hover': {
                bgcolor: '#c1616c'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <HistoryEduIcon />
            </ListItemIcon>
            <ListItemText primary="Autores" />
          </ListItemButton>
        </Link>
        <Link href="/admin/generos" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={selectedIndex === 4}
            onClick={(event) => handleListItemClick(event, 4)}
            sx={{ 
              borderRadius: '8px', 
              mx: 1, 
              '&.Mui-selected': { 
                bgcolor: '#d1717c',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': { bgcolor: '#c1616c' }
              },
              '&.Mui-selected:hover': {
                bgcolor: '#c1616c'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="Gêneros" />
          </ListItemButton>
        </Link>

        {/* Adicione outros itens do menu aqui, se necessário */}
        {/*
        <Link href="/admin/dashboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={selectedIndex === 2}
            onClick={(event) => handleListItemClick(event, 2)}
            sx={{ borderRadius: '8px', mx: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </Link>
        <Link href="/admin/settings" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={selectedIndex === 3}
            onClick={(event) => handleListItemClick(event, 3)}
            sx={{ borderRadius: '8px', mx: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Configurações" />
          </ListItemButton>
        </Link>
        */}
      </List>

      {/* Espaço flexível para empurrar os itens de tema para baixo */}
      <Box sx={{ flexGrow: 1 }} /> 

      {/* Ícones de tema (claro/escuro) */}

    </Box>
  );
}