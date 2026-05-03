"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import { AddSessionDialog } from "./add-session-dialog";
import { useAddSessionDialog } from "./use-add-session-dialog";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type AddSessionCtaProps = {
  planId: string;
  dayId: string;
};

export const AddSessionCta = ({ planId, dayId }: AddSessionCtaProps) => {
  const dialog = useAddSessionDialog();
  const touchTargetSx = useTouchTargetSx();

  return (
    <>
      <Button
        size="small"
        variant="text"
        startIcon={<AddIcon fontSize="small" />}
        onClick={dialog.open}
        sx={[{ alignSelf: "flex-start" }, touchTargetSx]}
      >
        Add session
      </Button>
      <AddSessionDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        planId={planId}
        dayId={dayId}
      />
    </>
  );
};
