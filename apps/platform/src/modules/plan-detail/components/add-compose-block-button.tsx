"use client";

import { useState } from "react";

import { PlusRowButton } from "@repo/ui";

import { ComposeEditorDrawer } from "../compose/components/compose-editor-drawer";

const BUTTON_LABEL = "Compose block";

type AddComposeBlockButtonProps = {
  planId: string;
  startDate: string;
  blockId: string;
};

export const AddComposeBlockButton: React.FC<AddComposeBlockButtonProps> = ({
  planId,
  startDate,
  blockId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <PlusRowButton onClick={() => setIsOpen(true)} label={BUTTON_LABEL} disabled={isOpen} />

      {isOpen && (
        <ComposeEditorDrawer
          open
          onClose={() => setIsOpen(false)}
          planId={planId}
          startDate={startDate}
          blockId={blockId}
        />
      )}
    </>
  );
};
