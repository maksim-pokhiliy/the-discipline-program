import { type AlternatingGroup } from "@repo/contracts/lms/alternating-group";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";

export type GroupRendering =
  | { kind: "alt"; group: AlternatingGroup; schemas: SchemaWithBody[] }
  | { kind: "schema"; schema: SchemaWithBody };

export const groupSchemasByAltGroup = (
  schemas: SchemaWithBody[],
  groups: AlternatingGroup[],
): GroupRendering[] => {
  const out: GroupRendering[] = [];
  const seen = new Set<string>();

  for (const schema of schemas) {
    const altGroupId = schema.schema.alternatingGroupId;

    if (altGroupId === null) {
      out.push({ kind: "schema", schema });
      continue;
    }

    if (seen.has(altGroupId)) {
      continue;
    }

    const group = groups.find((g) => g.id === altGroupId);

    if (group === undefined) {
      out.push({ kind: "schema", schema });
      continue;
    }

    const members = schemas.filter((s) => s.schema.alternatingGroupId === altGroupId);

    out.push({ kind: "alt", group, schemas: members });
    seen.add(altGroupId);
  }

  return out;
};
