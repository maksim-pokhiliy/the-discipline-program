"use client";

import { type ReactElement, useState } from "react";

import { Button } from "@mui/material";

import { AxisEditorModal } from "./axis-editor-modal";

const BUTTON_LABEL = "Add schema to group";

type AddTrackButtonProps = {
  planId: string;
  startDate: string;
  blockId: string;
  groupId: string;
};

export const AddTrackButton: React.FC<AddTrackButtonProps> = ({
  planId,
  startDate,
  blockId,
  groupId,
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="tiny"
        variant="text"
        onClick={() => setIsOpen(true)}
        disabled={isOpen}
        sx={{ alignSelf: "flex-start" }}
      >
        {BUTTON_LABEL}
      </Button>

      {isOpen && (
        <AxisEditorModal
          open
          onClose={() => setIsOpen(false)}
          planId={planId}
          startDate={startDate}
          mode={{ kind: "create", blockId, groupId }}
        />
      )}
    </>
  );
};
