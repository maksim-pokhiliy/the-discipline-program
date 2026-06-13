"use client";

import { useMemo, useState } from "react";

import { Button, Stack } from "@mui/material";

import type { Composition } from "@repo/contracts/lms/composition";
import { buildRowItems, type RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { deriveMinuteView } from "../lib/derive-minute-view";

import { RowEditorModal } from "./row-editor-modal";
import { RowGroupBox } from "./row-group-box";
import { SchemaRowCard } from "./schema-row-card";

const ADD_ROW_LABEL = "+ Add row";

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

  const items = useMemo(() => buildRowItems(rows, rowGroups), [rows, rowGroups]);

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
            />
          );
        })}
      </Stack>

      <Stack
        sx={(theme) => ({
          p: theme.spacing(1),
        })}
      >
        <Button
          size="tiny"
          variant="text"
          onClick={() => setIsCreateOpen(true)}
          sx={{ alignSelf: "flex-start" }}
          data-schema-id={schemaId}
        >
          {ADD_ROW_LABEL}
        </Button>
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
