"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";

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
    <Button
      onClick={() => createSession.mutate({})}
      startIcon={<AddIcon />}
      disabled={createSession.isPending}
      size="small"
      variant="outlined"
    >
      Add session
    </Button>
  );
};
