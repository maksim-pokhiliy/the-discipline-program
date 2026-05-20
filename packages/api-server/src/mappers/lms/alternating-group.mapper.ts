import { type AlternatingGroup as PrismaAlternatingGroup } from "@prisma/client";

import { type AlternatingGroup } from "@repo/contracts/lms/alternating-group";

type AlternatingGroupWithSchemas = PrismaAlternatingGroup & {
  schemas: { id: string }[];
};

export const mapToAlternatingGroup = (group: AlternatingGroupWithSchemas): AlternatingGroup => ({
  id: group.id,
  blockId: group.blockId,
  relationKind: group.relationKind,
  schemaIds: group.schemas.map((s) => s.id),
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
});
