"use client";

import { useState } from "react";

import { PlusRowButton } from "@repo/ui";

import { AxisEditorModal } from "./axis-editor-modal";

const BUTTON_LABEL = "Add schema";

type AddSchemaButtonProps = {
  planId: string;
  startDate: string;
  blockId: string;
};

export const AddSchemaButton: React.FC<AddSchemaButtonProps> = ({ planId, startDate, blockId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <PlusRowButton onClick={() => setIsOpen(true)} label={BUTTON_LABEL} disabled={isOpen} />

      {isOpen && (
        <AxisEditorModal
          open
          onClose={() => setIsOpen(false)}
          planId={planId}
          startDate={startDate}
          mode={{ kind: "create", blockId }}
        />
      )}
    </>
  );
};
