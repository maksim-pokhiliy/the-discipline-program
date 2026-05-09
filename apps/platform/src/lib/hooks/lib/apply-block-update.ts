import type {
  GetPlanBlocksResponse,
  PlanBlock,
  UpdatePlanBlockRequest,
} from "@repo/contracts/lms/plan-block";

const patchBlock = (block: PlanBlock, data: UpdatePlanBlockRequest): PlanBlock => ({
  ...block,
  ...(data.schemeTypeId !== undefined && { schemeTypeId: data.schemeTypeId }),
  ...(data.blockTypeIds !== undefined && { blockTypeIds: data.blockTypeIds }),
  ...(data.schemeParams !== undefined && { schemeParams: data.schemeParams }),
  ...(data.modifiers !== undefined && { modifiers: data.modifiers }),
  ...(data.notes !== undefined && { notes: data.notes }),
  ...(data.order !== undefined && { order: data.order }),
});

export const applyBlockUpdate = (
  prev: GetPlanBlocksResponse,
  id: string,
  data: UpdatePlanBlockRequest,
): GetPlanBlocksResponse => ({
  blocks: prev.blocks.map((block) => (block.id === id ? patchBlock(block, data) : block)),
});
