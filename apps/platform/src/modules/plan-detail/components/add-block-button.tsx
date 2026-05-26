"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import { useCreateBlock } from "@app/lib/hooks";

type AddBlockButtonProps = {
  planId: string;
  startDate: string;
  sessionId: string;
};

export const AddBlockButton: React.FC<AddBlockButtonProps> = ({ planId, startDate, sessionId }) => {
  const createBlock = useCreateBlock(planId, startDate, sessionId);

  return (
    <Button
      onClick={() => createBlock.mutate({})}
      startIcon={<AddIcon />}
      disabled={createBlock.isPending}
      size="small"
      variant="outlined"
      sx={{ borderStyle: "dashed", alignSelf: "flex-start" }}
    >
      Add block
    </Button>
  );
};
