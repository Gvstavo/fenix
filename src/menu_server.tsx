import { getSession } from "@/app/lib/session";
import { HeaderClient } from "./menu.tsx";

export default async function Header() {
  const user = await getSession();

  return <HeaderClient user={user} />;
}