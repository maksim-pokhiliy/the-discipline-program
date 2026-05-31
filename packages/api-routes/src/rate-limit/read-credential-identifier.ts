const IDENTIFIER_FIELD = "email";

const normalizeIdentifier = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  const normalized = raw.toLowerCase().trim();

  return normalized.length > 0 ? normalized : null;
};

const fromFormBody = (body: string): string | null => {
  try {
    return normalizeIdentifier(new URLSearchParams(body).get(IDENTIFIER_FIELD));
  } catch {
    return null;
  }
};

const fromJsonBody = (body: string): string | null => {
  try {
    const parsed: unknown = JSON.parse(body);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const value = (parsed as Record<string, unknown>)[IDENTIFIER_FIELD];

    return typeof value === "string" ? normalizeIdentifier(value) : null;
  } catch {
    return null;
  }
};

export const readCredentialIdentifier = async (request: Request): Promise<string | null> => {
  try {
    const body = await request.clone().text();

    if (!body) {
      return null;
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return fromJsonBody(body);
    }

    return fromFormBody(body) ?? fromJsonBody(body);
  } catch {
    return null;
  }
};
