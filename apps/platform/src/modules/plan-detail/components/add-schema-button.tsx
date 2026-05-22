"use client";

import { useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import { ArchetypePicker } from "./archetype-picker";
import { SchemaEditorModal } from "./schema-editor-modal";
import type { SchemaEditorMode, SelectedArchetype } from "./schema-editor-types";
import { SCHEMA_PARAM_FORM_REGISTRY } from "./schema-param-form-registry";

type AddSchemaButtonProps = {
  planId: string;
  startDate: string;
  blockId: string;
};

export const AddSchemaButton: React.FC<AddSchemaButtonProps> = ({ planId, startDate, blockId }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingArchetype, setPendingArchetype] = useState<SelectedArchetype | null>(null);

  const handleSelect = (selected: SelectedArchetype) => {
    setPickerOpen(false);

    if (SCHEMA_PARAM_FORM_REGISTRY[selected.name] === undefined) {
      return;
    }

    setPendingArchetype(selected);
  };

  const editorMode = useMemo<SchemaEditorMode | null>(
    () =>
      pendingArchetype === null ? null : { kind: "create", blockId, archetype: pendingArchetype },
    [blockId, pendingArchetype],
  );

  return (
    <>
      <Button
        onClick={() => setPickerOpen(true)}
        startIcon={<AddIcon />}
        size="small"
        variant="outlined"
      >
        Add schema
      </Button>

      <ArchetypePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />

      {editorMode !== null && (
        <SchemaEditorModal
          open
          onClose={() => setPendingArchetype(null)}
          mode={editorMode}
          planId={planId}
          startDate={startDate}
        />
      )}
    </>
  );
};
