import { type NextRequest } from "next/server";

import { SESSION_COOKIES } from "../constants";

export const hasSessionCookie = (req: NextRequest): boolean => {
  for (const name of SESSION_COOKIES) {
    if (req.cookies.has(name)) {
      return true;
    }
  }

  return false;
};
