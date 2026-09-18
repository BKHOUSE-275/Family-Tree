import { redirect } from "next/navigation";
import { BranchPlacePage } from "@/components/tree/BranchPlacePage";
import { getAppUser } from "@/lib/auth";
import { isCommittee } from "@/lib/types";

export default async function PlacePage() {
  const user = await getAppUser();
  if (!user || !isCommittee(user.role)) redirect("/");
  return <BranchPlacePage />;
}
