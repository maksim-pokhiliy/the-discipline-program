import {
  type ApplyTemplateInput,
  type ApplyTemplateResponse,
} from "@repo/contracts/lms/training-plan";

import { applyBlockTemplate } from "./apply-block-template";
import { applySessionTemplate } from "./apply-session-template";
import { applyWeekTemplate } from "./apply-week-template";

export type ApplyTemplateResult = ApplyTemplateResponse;

export const applyTemplate = async (
  userId: string,
  planId: string,
  data: ApplyTemplateInput,
): Promise<ApplyTemplateResult> => {
  switch (data.kind) {
    case "block": {
      const result = await applyBlockTemplate(userId, planId, data);

      return { created: { kind: "block", blockId: result.blockId } };
    }
    case "session": {
      const result = await applySessionTemplate(userId, planId, data);

      return { created: { kind: "session", sessionId: result.sessionId } };
    }
    case "week": {
      const result = await applyWeekTemplate(userId, planId, data);

      return { created: { kind: "week", weekId: result.weekId } };
    }
  }
};
