"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import { PlusRowButton } from "@repo/ui";

import { useCreateSession } from "@app/lib/hooks";

type AddSessionButtonProps = {
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
};

export const AddSessionButton: React.FC<AddSessionButtonProps> = ({
  planId,
  startDate,
  dayOfWeek,
}) => {
  const createSession = useCreateSession(planId, startDate, dayOfWeek);

  return (
    <PlusRowButton
      onClick={() => createSession.mutate({})}
      label="Add session"
      disabled={createSession.isPending}
    />
  );
};
