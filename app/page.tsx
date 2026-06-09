import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ADMIN_ROLES } from "@/constants/roles";
import type { Role } from "@/constants/roles";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (ADMIN_ROLES.includes(session.role as Role)) redirect("/admin");
  redirect("/dashboard");
}
