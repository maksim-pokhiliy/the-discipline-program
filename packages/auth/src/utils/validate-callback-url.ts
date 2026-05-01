import { ROLE_HOMES, type UserRole } from "@repo/contracts/iam/auth";

import { AUTH_ROUTES } from "../constants";

const DEFAULT_ALLOWED_PREFIXES = Array.from(
  new Set([...Object.values(ROLE_HOMES), AUTH_ROUTES.LOGIN]),
);

const isAllowedPrefix = (path: string, allowedPrefixes: readonly string[]): boolean =>
  allowedPrefixes.some(
    (prefix) => path === prefix || path === `${prefix}/` || path.startsWith(`${prefix}/`),
  );

type ValidateCallbackUrlOptions = {
  allowedRoles?: readonly UserRole[];
  allowedPrefixes?: readonly string[];
};

export const validateCallbackUrl = (
  raw: string | null | undefined,
  options: ValidateCallbackUrlOptions = {},
): string | null => {
  if (typeof raw !== "string" || raw.length === 0) {
    return null;
  }

  if (!raw.startsWith("/")) {
    return null;
  }

  if (raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }

  const path = raw.split("?")[0]?.split("#")[0] ?? raw;

  if (path === "/") {
    return raw;
  }

  const allowedPrefixes =
    options.allowedPrefixes ??
    (options.allowedRoles
      ? Array.from(
          new Set([...options.allowedRoles.map((role) => ROLE_HOMES[role]), AUTH_ROUTES.LOGIN]),
        )
      : DEFAULT_ALLOWED_PREFIXES);

  return isAllowedPrefix(path, allowedPrefixes) ? raw : null;
};
