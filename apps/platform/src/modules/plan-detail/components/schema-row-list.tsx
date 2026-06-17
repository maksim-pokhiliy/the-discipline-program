"use client";

import { useMemo, useRef, useState } from "react";

import { Button, Stack } from "@mui/material";
import { toast } from "sonner";

import type { Intensity } from "@repo/contracts/lms/_shared";
import type { Composition } from "@repo/contracts/lms/composition";
import { buildRowItems, type RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { deriveMinuteView } from "../lib/derive-minute-view";
import { useCreateRowGroup } from "../lib/use-create-row-group";

import { GroupSelectBar } from "./group-select-bar";
import { RowEditorModal } from "./row-editor-modal";
import { SchemaRowListBody } from "./schema-row-list-body";

const ADD_ROW_LABEL = "+ Add row";
const GROUP_ROWS_LABEL = "Group rows";
const GROUP_ROWS_BAR_LABEL = "Group rows";
const MIN_GROUPABLE_ROWS = 2;

type SchemaRowListProps = {
  planId: string;
  startDate: string;
  schemaId: string;
  rows: SchemaRow[];
  rowGroups: RowGroup[];
  composition?: Composition | null;
  blockIntensity?: Intensity | null;
  schemaIntensity?: Intensity | null;
  parentIsReorderPending?: boolean;
};

export const SchemaRowList: React.FC<SchemaRowListProps> = ({
  planId,
  startDate,
  schemaId,
  rows,
  rowGroups,
  composition = null,
  blockIntensity = null,
  schemaIntensity = null,
  parentIsReorderPending = false,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const createRowGroup = useCreateRowGroup(planId, startDate);
  const isFiredRef = useRef(false);

  const items = useMemo(() => buildRowItems(rows, rowGroups), [rows, rowGroups]);

  const ungroupedCount = useMemo(
    () => rows.filter((row) => row.rowGroupId === null).length,
    [rows],
  );

  const minuteLabelById = useMemo<Map<string, string>>(() => {
    if (composition === null) {
      return new Map();
    }

    const itemIds = items.map((item) => (item.kind === "group" ? item.group.id : item.row.id));
    const view = deriveMinuteView(composition, itemIds);

    if (view.kind === "none") {
      return new Map();
    }

    return new Map(
      view.assignments.map((assignment) => [assignment.rowId, assignment.minuteLabel]),
    );
  }, [composition, items]);

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (rowId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return next;
    });

  const handleGroup = () => {
    if (isFiredRef.current || createRowGroup.isPending) {
      return;
    }

    isFiredRef.current = true;
    void createRowGroup
      .run(
        { schemaId, rows, selectedIds },
        { onSuccess: exitSelectMode, onError: (message) => toast.error(message) },
      )
      .finally(() => {
        isFiredRef.current = false;
      });
  };

  return (
    <Stack direction="column">
      <SchemaRowListBody
        schemaId={schemaId}
        planId={planId}
        startDate={startDate}
        items={items}
        minuteLabelById={minuteLabelById}
        blockIntensity={blockIntensity}
        schemaIntensity={schemaIntensity}
        parentIsReorderPending={parentIsReorderPending}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelected}
      />

      {isSelectMode ? (
        <GroupSelectBar
          selectedCount={selectedIds.size}
          isPending={createRowGroup.isPending}
          onCancel={exitSelectMode}
          onGroup={handleGroup}
          groupLabel={GROUP_ROWS_BAR_LABEL}
        />
      ) : null}

      <Stack direction="row" spacing={1} sx={(theme) => ({ p: theme.spacing(1) })}>
        <Button
          size="tiny"
          variant="text"
          onClick={() => setIsCreateOpen(true)}
          sx={{ alignSelf: "flex-start" }}
          data-schema-id={schemaId}
        >
          {ADD_ROW_LABEL}
        </Button>

        {!isSelectMode && ungroupedCount >= MIN_GROUPABLE_ROWS ? (
          <Button
            size="tiny"
            variant="text"
            onClick={() => setIsSelectMode(true)}
            sx={{ alignSelf: "flex-start" }}
          >
            {GROUP_ROWS_LABEL}
          </Button>
        ) : null}
      </Stack>

      {isCreateOpen ? (
        <RowEditorModal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          planId={planId}
          startDate={startDate}
          mode={{ kind: "create", schemaId }}
        />
      ) : null}
    </Stack>
  );
};
