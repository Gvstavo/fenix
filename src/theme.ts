'use client';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
const primaryColor = '#d1717c';
const theme = createTheme({

  palette: {
    primary: {
      main: primaryColor, // Sua cor principal para destaque
    },
    // Você também pode definir uma cor secundária se quiser
    // secondary: {
    //   main: '#5d80b6', // Exemplo de cor secundária
    // },
    error: {
      main: red.A400, // Cores de erro geralmente são mantidas para padrão
    },
  },
  // Você pode adicionar outras personalizações de componentes aqui
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          // Garante que todos os botões "contained" usem sua cor principal
          // Se você já está usando sx em alguns botões, este pode ser redundante
          // mas é uma boa prática para um tema global.
          backgroundColor: primaryColor,
          '&:hover': {
            backgroundColor: '#b55a66',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: primaryColor, // Garante que o checkbox use a cor principal
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          // Isso garante que o foco use a cor primária definida acima
          // e o label também, se aplicável.
          '& .MuiInputLabel-root.Mui-focused': {
            color: primaryColor,
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: primaryColor,
          },
        },
      },
    },
  },


    cssVariables: true,
    typography: {
        fontFamily: 'var(--font-roboto)',
    },
});

export default theme;
