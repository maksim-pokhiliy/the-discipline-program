"use client";

import { useMemo, useRef, useState } from "react";

import { Button, Stack } from "@mui/material";
import { toast } from "sonner";

import type { Composition } from "@repo/contracts/lms/composition";
import { buildRowItems, type RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { deriveMinuteView } from "../lib/derive-minute-view";
import { useCreateRowGroup } from "../lib/use-create-row-group";

import { RowEditorModal } from "./row-editor-modal";
import { RowGroupSelectBar } from "./row-group-select-bar";
import { SchemaRowListBody } from "./schema-row-list-body";

const ADD_ROW_LABEL = "+ Add row";
const GROUP_ROWS_LABEL = "Group rows…";
const MIN_GROUPABLE_ROWS = 2;

type SchemaRowListProps = {
  planId: string;
  startDate: string;
  schemaId: string;
  rows: SchemaRow[];
  rowGroups: RowGroup[];
  composition?: Composition | null;
  parentIsReorderPending?: boolean;
};

export const SchemaRowList: React.FC<SchemaRowListProps> = ({
  planId,
  startDate,
  schemaId,
  rows,
  rowGroups,
  composition = null,
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

    const view = deriveMinuteView(
      composition,
      rows.map((row) => row.id),
    );

    if (view.kind === "none") {
      return new Map();
    }

    return new Map(
      view.assignments.map((assignment) => [assignment.rowId, assignment.minuteLabel]),
    );
  }, [composition, rows]);

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
        parentIsReorderPending={parentIsReorderPending}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelected}
      />

      {isSelectMode ? (
        <RowGroupSelectBar
          selectedCount={selectedIds.size}
          isPending={createRowGroup.isPending}
          onCancel={exitSelectMode}
          onGroup={handleGroup}
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
