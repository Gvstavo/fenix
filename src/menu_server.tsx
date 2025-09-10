import { getSession } from "@/app/lib/session";
import { HeaderClient } from "./menu.tsx";

export default async function Header() {
  const user = await getSession();
  console.log("session:", user);

  return <HeaderClient user={user} />;
}