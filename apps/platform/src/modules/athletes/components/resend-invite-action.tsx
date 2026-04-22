"use client";

import SendIcon from "@mui/icons-material/Send";
import { IconButton, Tooltip } from "@mui/material";

import { useResendCoachInvite } from "@app/lib/hooks";

type ResendInviteActionProps = {
  userId: string;
};

export const ResendInviteAction: React.FC<ResendInviteActionProps> = ({ userId }) => {
  const { mutate, isPending } = useResendCoachInvite();

  return (
    <Tooltip title="Resend invite">
      <span>
        <IconButton
          aria-label="Resend invite"
          onClick={() => mutate(userId)}
          disabled={isPending}
          sx={{ m: 1 }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
};
