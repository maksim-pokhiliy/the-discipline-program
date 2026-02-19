import { getServerSession } from "next-auth/next";

import { authOptions } from "@repo/auth/config";
import { UnauthorizedError } from "@repo/errors";

export const getAuthenticatedUserId = async (): Promise<string> => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session.user.id;
};
