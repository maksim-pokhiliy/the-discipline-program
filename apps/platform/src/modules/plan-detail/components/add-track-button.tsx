"use client";

import { type ReactElement } from "react";

import { PlusRowButton } from "@repo/ui";

import { useCreateSchema } from "@app/lib/hooks";

const BUTTON_LABEL = "Add track";
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

  const handleClick = () => {
    createSchema.mutate({
      blockId,
      groupId,
      composition: { repetition: { kind: "ladder", steps: PROTO_FIRST_LADDER } },
      header: null,
      notes: null,
    });
  };

  return (
    <PlusRowButton onClick={handleClick} label={BUTTON_LABEL} disabled={createSchema.isPending} />
  );
};
