import type { CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";
import { type JsonValue } from "@prisma/client/runtime/library";
import { z } from "zod";

import {
  type ActionItemMetadata,
  type CoachActionItem,
  missedWorkoutsMetadataSchema,
  newNoStartMetadataSchema,
  healthReportMetadataSchema,
} from "@repo/contracts/coach-action-item";

import {
  ACTION_ITEM_RESOLVE_REASON_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_MAP,
  ACTION_ITEM_TYPE_MAP,
} from "./enum-maps";

const metadataSchema = z.union([
  missedWorkoutsMetadataSchema,
  newNoStartMetadataSchema,
  healthReportMetadataSchema,
]);

const parseMetadata = (raw: JsonValue): ActionItemMetadata | null => {
  const result = metadataSchema.safeParse(raw);

  return result.success ? result.data : null;
};

export const mapToCoachActionItem = (item: PrismaCoachActionItemRecord): CoachActionItem => ({
  id: item.id,
  coachId: item.coachId,
  athleteId: item.athleteId,
  type: ACTION_ITEM_TYPE_MAP[item.type],
  severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
  status: ACTION_ITEM_STATUS_MAP[item.status],
  message: item.message,
  metadata: parseMetadata(item.metadata),
  resolvedAt: item.resolvedAt,
  resolveReason: item.resolveReason ? ACTION_ITEM_RESOLVE_REASON_MAP[item.resolveReason] : null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});
