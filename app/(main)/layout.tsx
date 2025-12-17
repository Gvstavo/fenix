import type { Metadata } from "next";
import Header from '@/src/menu_server.tsx';

export const metadata: Metadata = {
  title: "Fênix Project",
  description: "Inicial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <>
            <Header /> 
                {children}
          </>
    );
}
