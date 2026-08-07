const DEFAULT_IDENTIFIER_FIELDS = ["email"] as const;

export type CredentialIdentifierParse = "json" | "content-type";

const normalizeIdentifier = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  const normalized = raw.toLowerCase().trim();

  return normalized.length > 0 ? normalized : null;
};

const firstPresent = (
  fields: readonly string[],
  read: (field: string) => string | null,
): string | null => {
  for (const field of fields) {
    const value = normalizeIdentifier(read(field));

    if (value) {
      return value;
    }
  }

  return null;
};

const fromFormBody = (body: string, fields: readonly string[]): string | null => {
  try {
    const params = new URLSearchParams(body);

    return firstPresent(fields, (field) => params.get(field));
  } catch {
    return null;
  }
};

const fromJsonBody = (body: string, fields: readonly string[]): string | null => {
  try {
    const parsed: unknown = JSON.parse(body);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    return firstPresent(fields, (field) => {
      const value = record[field];

      return typeof value === "string" ? value : null;
    });
  } catch {
    return null;
  }
};

export const readCredentialIdentifier = async (
  request: Request,
  fields: readonly string[] = DEFAULT_IDENTIFIER_FIELDS,
  parse: CredentialIdentifierParse = "content-type",
): Promise<string | null> => {
  try {
    const body = await request.clone().text();

    if (!body) {
      return null;
    }

    if (parse === "json") {
      return fromJsonBody(body, fields);
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return fromJsonBody(body, fields);
    }

    return fromFormBody(body, fields) ?? fromJsonBody(body, fields);
  } catch {
    return null;
  }
};
