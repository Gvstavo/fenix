
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.admin) {
    redirect('/');
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Painel de Administração</h1>
      <p>Bem-vindo, {session.name}.</p>
      <p>Esta página é renderizada sem o menu principal, pois está fora do Route Group "(main)".</p>
    </div>
  );
}