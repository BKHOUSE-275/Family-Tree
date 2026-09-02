import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/layout/AdminNav";
import { getAppUser } from "@/lib/auth";
import { isCommittee } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (!isCommittee(user.role)) redirect("/");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AdminNav isSuperAdmin={user.role === "super_admin"} />
      {children}
    </div>
  );
}
