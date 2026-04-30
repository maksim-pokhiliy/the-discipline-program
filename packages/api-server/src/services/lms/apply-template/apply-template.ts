import { type ApplyTemplateInput } from "@repo/contracts/lms/training-plan";

import { applyBlockTemplate } from "./apply-block-template";
import { applySessionTemplate } from "./apply-session-template";
import { applyWeekTemplate } from "./apply-week-template";

export type ApplyTemplateResult = {
  created: { blockId?: string; sessionId?: string; weekId?: string };
};

export const applyTemplate = async (
  userId: string,
  planId: string,
  data: ApplyTemplateInput,
): Promise<ApplyTemplateResult> => {
  switch (data.kind) {
    case "block": {
      const result = await applyBlockTemplate(userId, planId, data);

      return { created: { blockId: result.blockId } };
    }
    case "session": {
      const result = await applySessionTemplate(userId, planId, data);

      return { created: { sessionId: result.sessionId } };
    }
    case "week": {
      const result = await applyWeekTemplate(userId, planId, data);

      return { created: { weekId: result.weekId } };
    }
  }
};
