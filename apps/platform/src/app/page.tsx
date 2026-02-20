import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@repo/auth/config";

const RootPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  redirect(session.user.role === "USER" ? "/athlete" : "/coach/plans");
};

export default RootPage;
