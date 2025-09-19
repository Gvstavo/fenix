import { Box, CssBaseline } from '@mui/material';
import { AdminSidebar } from '@/src/admin_menu.tsx'; // Importa a sidebar
import type { UserPayload } from "@/app/lib/session";
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Painel de Controle | Fênix Project",
  description: "Área de administração para gerenciar usuários, conteúdos e configurações do site Fênix Project.",
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proteção de rota no layout de admin
  const session = await getSession();

  if (!session?.admin) {
    redirect('/'); // Redireciona para a home se não for admin
  }

  return (
    <>
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
          {/* Menu Lateral */}
          <AdminSidebar />
          
          {/* Conteúdo Principal da Administração */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${240}px)` }, // Ajusta a largura para o conteúdo principal
            }}
          >
            {children}
          </Box>
        </Box>
      </>

  );
}