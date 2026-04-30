import { toast } from "sonner";

import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";
import { type PlanStructureSegment } from "@repo/contracts/lms/training-plan";

import { type CommandPaletteCommand } from "../command-palette.context";

export type ApplyTemplateCommandOptions = {
  segment: PlanStructureSegment | null;
  templates: readonly SchemeTemplate[];
  promptForTemplate: (
    segment: PlanStructureSegment,
    templates: readonly SchemeTemplate[],
  ) => SchemeTemplate | null;
  applyTemplate: (segment: PlanStructureSegment, template: SchemeTemplate) => Promise<void> | void;
};

export const promptForTemplateFromWindow = (
  segment: PlanStructureSegment,
  templates: readonly SchemeTemplate[],
): SchemeTemplate | null => {
  if (typeof window === "undefined" || templates.length === 0) {
    return null;
  }

  const list = templates
    .map((template, index) => `${(index + 1).toString()}. ${template.name}`)
    .join("\n");
  const raw = window.prompt(
    `Segment "${segment.label ?? "(unnamed)"}" — pick scheme template by number:\n${list}`,
  );

  if (raw === null) {
    return null;
  }

  const choice = Number.parseInt(raw.trim(), 10);

  if (!Number.isFinite(choice)) {
    return null;
  }

  const index = choice - 1;

  return templates[index] ?? null;
};

export const createApplyTemplateCommand = (
  options: ApplyTemplateCommandOptions,
): CommandPaletteCommand => {
  const { segment, templates, promptForTemplate, applyTemplate } = options;

  return {
    id: "plan.apply-template",
    title: "Apply scheme template to selected segment",
    hint: segment ? `Selected: ${segment.label ?? "(unnamed)"}` : "Select a segment first",
    group: "Segment",
    keywords: ["template", "scheme", "preset"],
    perform: async () => {
      if (!segment) {
        toast.error("Select a segment first to apply a template");

        return;
      }

      if (templates.length === 0) {
        toast.error("No scheme templates available");

        return;
      }

      const next = promptForTemplate(segment, templates);

      if (!next) {
        return;
      }

      await applyTemplate(segment, next);
    },
  };
};
