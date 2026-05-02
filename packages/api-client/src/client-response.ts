import { InternalServerError } from "@repo/errors";

import { type ResponseSchema } from "./client-types";

const readJsonBody = async (response: Response, fullUrl: string): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    throw new InternalServerError("Failed to parse API response", {
      status: response.status,
      url: fullUrl,
    });
  }
};

export const parseSuccessBody = async <T>(
  response: Response,
  fullUrl: string,
  schema: ResponseSchema<T> | undefined,
): Promise<T> => {
  const body = await readJsonBody(response, fullUrl);

  if (schema) {
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw new InternalServerError("API response did not match expected schema", {
        status: response.status,
        url: fullUrl,
        issues: parsed.error.issues,
      });
    }

    return parsed.data;
  }

  return body as T;
};
