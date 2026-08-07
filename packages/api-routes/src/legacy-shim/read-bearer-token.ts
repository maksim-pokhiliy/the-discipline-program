const BEARER_PREFIX = "bearer";

export const readLegacyBearerToken = (request: Request): string | null => {
  const header = request.headers.get("authorization");

  if (header === null) {
    return null;
  }

  const withoutPrefix = header.toLowerCase().startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length)
    : header;
  const token = withoutPrefix.trim();

  return token.length > 0 ? token : null;
};
