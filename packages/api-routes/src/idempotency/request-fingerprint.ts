import { createHash } from "node:crypto";

export const sha256Hex = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

export const fingerprintRawBody = (raw: string): string => sha256Hex(raw);

export const fingerprintFormData = async (form: FormData): Promise<string> => {
  const fields: Array<{ name: string; size: number; sha: string }> = [];

  for (const name of Array.from(new Set(form.keys())).sort()) {
    for (const value of form.getAll(name)) {
      if (value instanceof File) {
        const bytes = new Uint8Array(await value.arrayBuffer());

        fields.push({ name, size: bytes.byteLength, sha: sha256Hex(bytes) });
      } else {
        const bytes = new TextEncoder().encode(value);

        fields.push({ name, size: bytes.byteLength, sha: sha256Hex(bytes) });
      }
    }
  }

  return sha256Hex(JSON.stringify(fields));
};
