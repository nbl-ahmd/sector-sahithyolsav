import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (isValidAdminSessionToken(token)) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
