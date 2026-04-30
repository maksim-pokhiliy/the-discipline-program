"use client";

import { useMemo, useState } from "react";

import { Alert, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { useBlockKindsPageData, usePlanStructure } from "@app/lib/hooks";

import { useEditingTarget } from "../../lib/editing-target";
import { parseSinglePlanSelection } from "../plan-canvas/selection";

import { AthletePreview } from "./athlete-preview";
import { BlockInspector } from "./block-inspector";
import { EntryInspector } from "./entry-inspector";
import { InspectorEmptyState } from "./inspector-empty-state";
import { OverrideListSection } from "./override-list-section";
import { SegmentInspector } from "./segment-inspector";
import { useSelectedBlock, useSelectedEntry, useSelectedSegment } from "./use-selected-entities";

type InspectorTab = "edit" | "preview";

export type InspectorPanelProps = {
  planId: string;
};

export const InspectorPanel = ({ planId }: InspectorPanelProps) => {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("fromWeek");
  const toParam = searchParams.get("toWeek");
  const fromWeek = fromParam !== null ? Number(fromParam) : undefined;
  const toWeek = toParam !== null ? Number(toParam) : undefined;

  const planStructure = usePlanStructure(planId, { fromWeek, toWeek });
  const blockKinds = useBlockKindsPageData({ scope: "ALL", take: 200 });
  const { target } = useEditingTarget();

  const selection = useMemo(
    () => parseSinglePlanSelection(searchParams.get("selected")),
    [searchParams],
  );

  const selectedBlock = useSelectedBlock(
    planStructure.data,
    selection?.kind === "block" ? selection.id : "",
  );
  const selectedSegment = useSelectedSegment(
    planStructure.data,
    selection?.kind === "segment" ? selection.id : "",
  );
  const selectedEntry = useSelectedEntry(
    planStructure.data,
    selection?.kind === "entry" ? selection.id : "",
  );

  const previewBlock = useMemo(() => {
    if (selection?.kind === "block") {
      return selectedBlock;
    }

    if (selection?.kind === "segment") {
      return selectedSegment?.block ?? null;
    }

    if (selection?.kind === "entry") {
      return selectedEntry?.block ?? null;
    }

    return null;
  }, [selectedBlock, selectedEntry, selectedSegment, selection]);

  const [tab, setTab] = useState<InspectorTab>("edit");

  const renderEditor = () => {
    if (!selection) {
      if (target.kind === "athlete") {
        return <OverrideListSection enrollmentId={target.enrollmentId} />;
      }

      return <InspectorEmptyState message="Select a node to inspect" />;
    }

    if (planStructure.error) {
      return <Alert severity="error">{planStructure.error.message}</Alert>;
    }

    if (!planStructure.data) {
      return <InspectorEmptyState message="Loading plan..." />;
    }

    if (selection.kind === "block") {
      if (!selectedBlock) {
        return <InspectorEmptyState message="Block not found" />;
      }

      return (
        <BlockInspector planId={planId} block={selectedBlock} blockKinds={blockKinds.data?.items} />
      );
    }

    if (selection.kind === "segment") {
      if (!selectedSegment) {
        return <InspectorEmptyState message="Segment not found" />;
      }

      return <SegmentInspector planId={planId} segment={selectedSegment.segment} />;
    }

    if (!selectedEntry) {
      return <InspectorEmptyState message="Entry not found" />;
    }

    return <EntryInspector planId={planId} entry={selectedEntry.entry} />;
  };

  const renderPreview = () => {
    if (!previewBlock) {
      return <InspectorEmptyState message="Select a block (or any of its children) to preview" />;
    }

    return <AthletePreview block={previewBlock} />;
  };

  return (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        p: 3,
        bgcolor: "background.paper",
        borderLeft: 1,
        borderColor: "divider",
        overflowY: "auto",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Inspector
        </Typography>
      </Stack>

      <Tabs value={tab} onChange={(_event, next: InspectorTab) => setTab(next)} variant="fullWidth">
        <Tab value="edit" label="Edit" />
        <Tab value="preview" label="Preview as athlete" />
      </Tabs>

      {tab === "edit" ? renderEditor() : renderPreview()}
    </Stack>
  );
};
