"use client";

import { useMemo, useRef, useState } from "react";

import { Button, Stack } from "@mui/material";
import { toast } from "sonner";

import type { Composition } from "@repo/contracts/lms/composition";
import { buildRowItems, type RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { PlusRowButton } from "@repo/ui";

import { deriveMinuteView } from "../lib/derive-minute-view";
import { useCreateRowGroup } from "../lib/use-create-row-group";

import { RowEditorModal } from "./row-editor-modal";
import { RowGroupBox } from "./row-group-box";
import { RowGroupSelectBar } from "./row-group-select-bar";
import { SchemaRowCard } from "./schema-row-card";

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

    const selectedRows = rows.filter((row) => selectedIds.has(row.id));

    isFiredRef.current = true;
    void createRowGroup
      .run(
        { schemaId, rows: selectedRows },
        { onSuccess: exitSelectMode, onError: (message) => toast.error(message) },
      )
      .finally(() => {
        isFiredRef.current = false;
      });
  };

  let runningIndex = 0;

  return (
    <Stack direction="column">
      <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
        {items.map((item) => {
          if (item.kind === "group") {
            const startIndex = runningIndex;

            runningIndex += item.members.length;

            return (
              <RowGroupBox
                key={`group-${item.group.id}`}
                group={item.group}
                members={item.members}
                planId={planId}
                startDate={startDate}
                startIndex={startIndex}
                isReorderPending={parentIsReorderPending}
              />
            );
          }

          const index = runningIndex;

          runningIndex += 1;

          return (
            <SchemaRowCard
              key={item.row.id}
              row={item.row}
              planId={planId}
              startDate={startDate}
              index={index}
              minuteLabel={minuteLabelById.get(item.row.id) ?? null}
              isReorderPending={parentIsReorderPending}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(item.row.id)}
              onToggleSelect={toggleSelected}
            />
          );
        })}
      </Stack>

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
          <PlusRowButton onClick={() => setIsSelectMode(true)} label={GROUP_ROWS_LABEL} />
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
