"use client";

import { type ReactElement } from "react";

import { toast } from "sonner";

import { PlusRowButton } from "@repo/ui";

import { makeNodeId } from "../lib/axis-draft-id";
import { useCreateGroup } from "../lib/use-create-group";

const BUTTON_LABEL = "Add group";
const PROTO_FIRST_LADDER = [21, 15, 9];
const PROTO_SECOND_LADDER = [9, 15, 21];

type AddGroupButtonProps = {
  planId: string;
  startDate: string;
  blockId: string;
};

export const AddGroupButton: React.FC<AddGroupButtonProps> = ({
  planId,
  startDate,
  blockId,
}): ReactElement => {
  const createGroup = useCreateGroup(planId, startDate);

  const handleClick = () => {
    createGroup.run(
      {
        blockId,
        draft: {
          id: makeNodeId(),
          header: null,
          tracks: [
            { id: makeNodeId(), header: null, steps: PROTO_FIRST_LADDER },
            { id: makeNodeId(), header: null, steps: PROTO_SECOND_LADDER },
          ],
        },
      },
      {
        onSuccess: () => undefined,
        onError: (message) => toast.error(message),
      },
    );
  };

  return (
    <PlusRowButton onClick={handleClick} label={BUTTON_LABEL} disabled={createGroup.isPending} />
  );
};
