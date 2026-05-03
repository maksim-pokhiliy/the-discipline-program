import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

export type TemplateDragKind = "template-block" | "template-session" | "template-week";

export type ParsedTemplateActive = { kind: TemplateDragKind; templateId: string } | null;

export type TemplateDropTarget =
  | { kind: "session"; sessionId: string; order: number }
  | { kind: "day"; dayId: string; order: number }
  | { kind: "week"; index: number };

export const parseTemplateActiveKey = (activeKey: string): ParsedTemplateActive => {
  const sepIndex = activeKey.indexOf(":");

  if (sepIndex < 0) {
    return null;
  }

  const prefix = activeKey.slice(0, sepIndex);
  const templateId = activeKey.slice(sepIndex + 1);

  if (prefix === "template-block" || prefix === "template-session" || prefix === "template-week") {
    return { kind: prefix, templateId };
  }

  return null;
};

export const resolveTemplateDropTarget = (
  active: ParsedTemplateActive,
  overKey: string,
  data: GetPlanStructureResponse | undefined,
): TemplateDropTarget | null => {
  if (!active || !data) {
    return null;
  }

  const sepIndex = overKey.indexOf(":");

  if (sepIndex < 0) {
    return null;
  }

  const overPrefix = overKey.slice(0, sepIndex);
  const overId = overKey.slice(sepIndex + 1);

  if (active.kind === "template-block" && overPrefix === "session") {
    let order = 0;

    for (const week of data.plan.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.id === overId) {
            order = session.blocks.length;
          }
        }
      }
    }

    return { kind: "session", sessionId: overId, order };
  }

  if (active.kind === "template-session" && overPrefix === "day") {
    let order = 0;

    for (const week of data.plan.weeks) {
      for (const day of week.days) {
        if (day.id === overId) {
          order = day.sessions.length;
        }
      }
    }

    return { kind: "day", dayId: overId, order };
  }

  if (active.kind === "template-week" && overPrefix === "week") {
    if (overId === "new") {
      return { kind: "week", index: data.plan.weeks.length };
    }

    const idx = Number.parseInt(overId, 10);

    if (Number.isNaN(idx)) {
      return null;
    }

    return { kind: "week", index: idx };
  }

  return null;
};
