"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { RowKindPicker } from "../../components/row-kind-picker";
import type { NodeId } from "../compose-tree.types";

const ADD_CONTAINER_LABEL = "+ group";
const ADD_ROW_LABEL = "+ row";

type ComposeAddNodeMenuProps = {
  parentId: NodeId;
  isStructuralEditingAllowed: boolean;
  onAddContainer: (parentId: NodeId) => void;
  onAddRow: (parentId: NodeId, rowKind: RowKind) => void;
};

export const ComposeAddNodeMenu: React.FC<ComposeAddNodeMenuProps> = ({
  parentId,
  isStructuralEditingAllowed,
  onAddContainer,
  onAddRow,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  const handlePick = (rowKind: RowKind): void => {
    onAddRow(parentId, rowKind);
  };

  if (!isStructuralEditingAllowed) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Button
        size="tiny"
        variant="text"
        startIcon={<AddIcon fontSize="small" />}
        onClick={() => onAddContainer(parentId)}
      >
        {ADD_CONTAINER_LABEL}
      </Button>

      <Button
        size="tiny"
        variant="text"
        startIcon={<AddIcon fontSize="small" />}
        onClick={() => setIsPickerOpen(true)}
      >
        {ADD_ROW_LABEL}
      </Button>

      <RowKindPicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePick}
      />
    </Stack>
  );
};
