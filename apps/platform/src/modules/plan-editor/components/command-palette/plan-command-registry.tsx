"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";
import {
  type GetPlanStructureResponse,
  type PlanStructureBlock,
  type PlanStructureSegment,
} from "@repo/contracts/lms/training-plan";

import {
  useBlockKindsPageData,
  usePlanBulkPatch,
  usePlanStructure,
  useSchemeTemplatesPageData,
} from "@app/lib/hooks";

import { useBulkActionContext } from "../bulk-action-toolbar";
import { findBlockById, findSegmentById } from "../inspector/use-selected-entities";
import {
  formatSinglePlanSelection,
  parsePlanSelection,
  parseSinglePlanSelection,
} from "../plan-canvas/selection";
import { usePlanDialogs } from "../plan-dialogs-context";
import { SaveTemplateDialog } from "../save-template-dialog";

import { usePaletteCommand } from "./command-palette.context";
import { createApplyTemplateCommand, promptForTemplateFromWindow } from "./commands/apply-template";
import { createBulkDeleteCommand } from "./commands/bulk-delete";
import { createBulkReplaceCommand } from "./commands/bulk-replace";
import { createBulkSuspendCommand } from "./commands/bulk-suspend";
import {
  createChangeBlockKindCommand,
  promptForBlockKindFromWindow,
} from "./commands/change-block-kind";
import { createCloneDayCommand } from "./commands/clone-day";
import { createCreateWeekCommand } from "./commands/create-week";
import { createDuplicateWeekCommand } from "./commands/duplicate-week";
import { createJumpToWeekCommand } from "./commands/jump-to-week";
import { createRepeatWeeksCommand } from "./commands/repeat-weeks";
import { createSaveAsTemplateCommand } from "./commands/save-as-template";
import { createSearchPlanCommand } from "./commands/search-plan";
import { createShiftWeeksCommand } from "./commands/shift-weeks";

export type PlanCommandRegistryProps = {
  planId: string;
};

const findCurrentWeekIndex = (data: GetPlanStructureResponse | undefined): number | null => {
  const first = data?.plan.weeks[0];

  return first ? first.index : null;
};

const buildBlockUpdateOp = (block: PlanStructureBlock, kindId: string) =>
  ({
    kind: "update-block" as const,
    blockId: block.id,
    expectedVersion: block.version,
    fullEntity: {
      order: block.order,
      kindId,
      title: block.title,
      status: block.status,
      weight: block.weight,
      notes: block.notes,
    },
  }) as const;

const buildSegmentUpdateOp = (segment: PlanStructureSegment, template: SchemeTemplate) =>
  ({
    kind: "update-segment" as const,
    segmentId: segment.id,
    expectedVersion: segment.version,
    fullEntity: {
      order: segment.order,
      label: segment.label,
      archetypeKind: template.archetypeKind,
      schemeParams: template.defaultParams,
      schemeTemplateId: template.id,
      restConfig: segment.restConfig,
    },
  }) as const;

export const PlanCommandRegistry = ({ planId }: PlanCommandRegistryProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("fromWeek");
  const toParam = searchParams.get("toWeek");
  const fromWeek = fromParam !== null ? Number(fromParam) : undefined;
  const toWeek = toParam !== null ? Number(toParam) : undefined;

  const planStructure = usePlanStructure(planId, { fromWeek, toWeek });
  const blockKindsQuery = useBlockKindsPageData({ scope: "ALL", take: 200 });
  const templatesQuery = useSchemeTemplatesPageData({ scope: "ALL", take: 200 });
  const bulkPatch = usePlanBulkPatch(planId);

  const selection = useMemo(
    () => parseSinglePlanSelection(searchParams.get("selected")),
    [searchParams],
  );
  const multiSelection = useMemo(
    () => parsePlanSelection(searchParams.get("selected")),
    [searchParams],
  );

  const bulkActions = useBulkActionContext();
  const planDialogs = usePlanDialogs();

  const selectedBlock = useMemo<PlanStructureBlock | null>(() => {
    if (selection?.kind === "block") {
      return findBlockById(planStructure.data, selection.id);
    }

    if (selection?.kind === "segment") {
      const found = findSegmentById(planStructure.data, selection.id);

      return found ? found.block : null;
    }

    return null;
  }, [planStructure.data, selection]);

  const selectedSegment = useMemo<PlanStructureSegment | null>(() => {
    if (selection?.kind === "segment") {
      const found = findSegmentById(planStructure.data, selection.id);

      return found ? found.segment : null;
    }

    return null;
  }, [planStructure.data, selection]);

  const jumpToWeek = useCallback(
    (index: number) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("fromWeek", String(index));
      params.set("toWeek", String(index));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const jumpToBlock = useCallback(
    (result: { weekIndex: number; blockId: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("fromWeek", String(result.weekIndex));
      params.set("toWeek", String(result.weekIndex));
      params.set("selected", formatSinglePlanSelection({ kind: "block", id: result.blockId }));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const applyKind = useCallback(
    async (block: PlanStructureBlock, kind: BlockKind) => {
      await bulkPatch.mutateAsync({ ops: [buildBlockUpdateOp(block, kind.id)] });
    },
    [bulkPatch],
  );

  const applyTemplate = useCallback(
    async (segment: PlanStructureSegment, template: SchemeTemplate) => {
      await bulkPatch.mutateAsync({ ops: [buildSegmentUpdateOp(segment, template)] });
    },
    [bulkPatch],
  );

  const maxIndex = planStructure.data?.window.maxIndex ?? 0;
  const currentWeekIndex = findCurrentWeekIndex(planStructure.data);

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  const saveTemplateScope: "block" | "session" | "week" | null = selectedBlock ? "block" : null;
  const triggerSaveTemplate = useCallback(() => {
    setSaveTemplateOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "s";

      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      triggerSaveTemplate();
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [triggerSaveTemplate]);

  const createCommand = useMemo(
    () => createCreateWeekCommand({ onTrigger: planDialogs.openAddWeek }),
    [planDialogs.openAddWeek],
  );
  const duplicateCommand = useMemo(
    () => createDuplicateWeekCommand({ planId, currentWeekIndex }),
    [currentWeekIndex, planId],
  );
  const jumpCommand = useMemo(
    () => createJumpToWeekCommand({ maxIndex, jumpToWeek }),
    [jumpToWeek, maxIndex],
  );
  const searchCommand = useMemo(
    () => createSearchPlanCommand({ data: planStructure.data, onSelect: jumpToBlock }),
    [jumpToBlock, planStructure.data],
  );
  const changeKindCommand = useMemo(
    () =>
      createChangeBlockKindCommand({
        block: selectedBlock,
        blockKinds: blockKindsQuery.data?.items ?? [],
        promptForKind: promptForBlockKindFromWindow,
        applyKind,
      }),
    [applyKind, blockKindsQuery.data, selectedBlock],
  );
  const applyTemplateCommand = useMemo(
    () =>
      createApplyTemplateCommand({
        segment: selectedSegment,
        templates: templatesQuery.data?.items ?? [],
        promptForTemplate: promptForTemplateFromWindow,
        applyTemplate,
      }),
    [applyTemplate, selectedSegment, templatesQuery.data],
  );
  const saveAsTemplateCommand = useMemo(
    () =>
      createSaveAsTemplateCommand({
        scope: saveTemplateScope,
        onTrigger: triggerSaveTemplate,
      }),
    [saveTemplateScope, triggerSaveTemplate],
  );

  const bulkCount = multiSelection?.ids.length ?? 0;
  const bulkKind = multiSelection?.kind ?? null;
  const isMultiSelection = bulkCount >= 2;
  const bulkNoun =
    bulkKind === "block"
      ? bulkCount === 1
        ? "block"
        : "blocks"
      : bulkKind === "segment"
        ? bulkCount === 1
          ? "segment"
          : "segments"
        : bulkCount === 1
          ? "entry"
          : "entries";

  const bulkReplaceCommand = useMemo(
    () =>
      createBulkReplaceCommand({
        enabled: isMultiSelection && bulkKind === "entry",
        count: bulkCount,
        onTrigger: () => bulkActions.openDialog("replace"),
      }),
    [bulkActions, bulkCount, bulkKind, isMultiSelection],
  );
  const bulkSuspendCommand = useMemo(
    () =>
      createBulkSuspendCommand({
        enabled: isMultiSelection && bulkKind === "block",
        count: bulkCount,
        onTrigger: () => bulkActions.openDialog("suspend"),
      }),
    [bulkActions, bulkCount, bulkKind, isMultiSelection],
  );
  const bulkDeleteCommand = useMemo(
    () =>
      createBulkDeleteCommand({
        enabled: isMultiSelection,
        count: bulkCount,
        noun: bulkNoun,
        onTrigger: () => bulkActions.openDialog("delete"),
      }),
    [bulkActions, bulkCount, bulkNoun, isMultiSelection],
  );
  const cloneDayCommand = useMemo(
    () => createCloneDayCommand({ onTrigger: () => bulkActions.openDialog("clone-day") }),
    [bulkActions],
  );
  const repeatWeeksCommand = useMemo(
    () => createRepeatWeeksCommand({ onTrigger: () => bulkActions.openDialog("repeat-weeks") }),
    [bulkActions],
  );
  const shiftWeeksCommand = useMemo(
    () => createShiftWeeksCommand({ onTrigger: () => bulkActions.openDialog("shift-weeks") }),
    [bulkActions],
  );

  usePaletteCommand(createCommand);
  usePaletteCommand(duplicateCommand);
  usePaletteCommand(jumpCommand);
  usePaletteCommand(searchCommand);
  usePaletteCommand(changeKindCommand);
  usePaletteCommand(applyTemplateCommand);
  usePaletteCommand(saveAsTemplateCommand);
  usePaletteCommand(bulkReplaceCommand);
  usePaletteCommand(bulkSuspendCommand);
  usePaletteCommand(bulkDeleteCommand);
  usePaletteCommand(cloneDayCommand);
  usePaletteCommand(repeatWeeksCommand);
  usePaletteCommand(shiftWeeksCommand);

  return (
    <SaveTemplateDialog
      open={saveTemplateOpen}
      onClose={() => setSaveTemplateOpen(false)}
      planStructure={planStructure.data}
      selectedBlock={selectedBlock}
    />
  );
};
