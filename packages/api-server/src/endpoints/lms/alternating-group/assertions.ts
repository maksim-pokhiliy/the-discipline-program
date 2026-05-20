import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { type TxClient } from "../_shared";

const ALTERNATING_SETS_ARCHETYPE = "alternating-sets";

export const assertPlanEditableInTx = async (tx: TxClient, planId: string): Promise<void> => {
  const plan = await tx.trainingPlan.findUnique({
    where: { id: planId },
    select: { deletedAt: true, status: true },
  });

  if (!plan || plan.deletedAt !== null) {
    throw new NotFoundError("Training plan not found", { planId });
  }

  if (plan.status === "ARCHIVED") {
    throw new ForbiddenError("Plan is archived; edits not allowed");
  }
};

type CandidateSchema = {
  id: string;
  blockId: string;
  parentSchemaId: string | null;
  alternatingGroupId: string | null;
  archetype: { name: string };
};

const assertMemberShape = (schema: CandidateSchema): void => {
  if (schema.parentSchemaId !== null) {
    throw new BadRequestError("Alternating group members must be top-level block schemas", {
      schemaId: schema.id,
    });
  }

  if (schema.archetype.name !== ALTERNATING_SETS_ARCHETYPE) {
    throw new BadRequestError("Alternating group members must use the alternating-sets archetype", {
      schemaId: schema.id,
      archetype: schema.archetype.name,
    });
  }
};

export const assertGroupMembersApplicable = async (
  tx: TxClient,
  schemaIds: readonly string[],
): Promise<string> => {
  const members = await tx.schema.findMany({
    where: { id: { in: [...schemaIds] } },
    select: {
      id: true,
      blockId: true,
      parentSchemaId: true,
      alternatingGroupId: true,
      archetype: { select: { name: true } },
    },
  });

  const [first, ...rest] = members;

  if (!first || members.length !== schemaIds.length) {
    throw new NotFoundError("Schema not found", {
      missing: schemaIds.filter((id) => !members.some((m) => m.id === id)),
    });
  }

  for (const member of members) {
    assertMemberShape(member);

    if (member.alternatingGroupId !== null) {
      throw new BadRequestError("Schema already belongs to an alternating group", {
        schemaId: member.id,
        alternatingGroupId: member.alternatingGroupId,
      });
    }
  }

  if (rest.some((m) => m.blockId !== first.blockId)) {
    throw new BadRequestError("Alternating group members must belong to the same block", {
      blockIds: [...new Set(members.map((m) => m.blockId))],
    });
  }

  return first.blockId;
};

export const assertMemberApplicable = async (
  tx: TxClient,
  schemaId: string,
  groupId: string,
  groupBlockId: string,
): Promise<void> => {
  const schema = await tx.schema.findUnique({
    where: { id: schemaId },
    select: {
      id: true,
      blockId: true,
      parentSchemaId: true,
      alternatingGroupId: true,
      archetype: { select: { name: true } },
    },
  });

  if (!schema) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  if (schema.alternatingGroupId === groupId) {
    throw new BadRequestError("Schema is already a member of this alternating group", {
      schemaId,
      groupId,
    });
  }

  if (schema.alternatingGroupId !== null) {
    throw new BadRequestError("Schema already belongs to another alternating group", {
      schemaId,
      alternatingGroupId: schema.alternatingGroupId,
    });
  }

  assertMemberShape(schema);

  if (schema.blockId !== groupBlockId) {
    throw new BadRequestError("Alternating group members must belong to the same block", {
      schemaId,
      schemaBlockId: schema.blockId,
      groupBlockId,
    });
  }
};
