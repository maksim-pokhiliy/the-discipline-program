"use client";

import { PlusRowButton } from "@repo/ui";

import { useCreateBlock } from "@app/lib/hooks";

type AddBlockButtonProps = {
  planId: string;
  startDate: string;
  sessionId: string;
};

export const AddBlockButton: React.FC<AddBlockButtonProps> = ({ planId, startDate, sessionId }) => {
  const createBlock = useCreateBlock(planId, startDate, sessionId);

  return (
    <PlusRowButton
      onClick={() => createBlock.mutate({})}
      label="Add block"
      disabled={createBlock.isPending}
    />
  );
};
