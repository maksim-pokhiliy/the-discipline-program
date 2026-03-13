"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Button } from "@mui/material";

import { useCopyWeek } from "@app/lib/hooks";

import { addDays } from "./week-helpers";

type CopyWeekButtonProps = {
  planId: string;
  currentWeekStart: Date;
};

export const CopyWeekButton: React.FC<CopyWeekButtonProps> = ({ planId, currentWeekStart }) => {
  const copyWeek = useCopyWeek(planId);
  const previousWeekStart = addDays(currentWeekStart, -7);

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<ContentCopyIcon />}
      onClick={() =>
        copyWeek.mutate({ sourceDate: previousWeekStart, targetDate: currentWeekStart })
      }
      disabled={copyWeek.isPending}
    >
      {copyWeek.isPending ? "Copying..." : "Copy previous week"}
    </Button>
  );
};
