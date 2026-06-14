"use client";

import { type ReactElement, useRef } from "react";

import { Button } from "@mui/material";

import { useCreateSchema } from "@app/lib/hooks";

const BUTTON_LABEL = "Add schema to group";
const PROTO_FIRST_LADDER = [21, 15, 9];

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
  const createSchema = useCreateSchema(planId, startDate);
  const isFiredRef = useRef(false);

  const handleClick = () => {
    if (isFiredRef.current || createSchema.isPending) {
      return;
    }

    isFiredRef.current = true;
    createSchema.mutate(
      {
        blockId,
        groupId,
        composition: { repetition: { kind: "ladder", steps: PROTO_FIRST_LADDER } },
        header: null,
        notes: null,
      },
      {
        onSettled: () => {
          isFiredRef.current = false;
        },
      },
    );
  };

  return (
    <Button
      size="tiny"
      variant="text"
      onClick={handleClick}
      disabled={createSchema.isPending}
      sx={{ alignSelf: "flex-start" }}
    >
      {BUTTON_LABEL}
    </Button>
  );
};
