"use client";

import { type ReactElement, useEffect, useState } from "react";

import { Alert, Button, Collapse } from "@mui/material";

import { PICK_RETRY_LABEL } from "../utils/athlete-profile.constants";
import { type LevelSwitchOutcome } from "../utils/use-profile-level-switch";

export type ProfileAxisOutcomeStripProps = {
  outcome: LevelSwitchOutcome | null;
  onRetry: () => void;
};

export const ProfileAxisOutcomeStrip = ({
  outcome,
  onRetry,
}: ProfileAxisOutcomeStripProps): ReactElement | null => {
  const [shown, setShown] = useState<LevelSwitchOutcome | null>(outcome);

  useEffect(() => {
    if (outcome !== null) {
      setShown(outcome);
    }
  }, [outcome]);

  if (shown === null) {
    return null;
  }

  return (
    <Collapse in={outcome !== null} unmountOnExit>
      <Alert
        severity={shown.isApplied ? "success" : "error"}
        {...(!shown.isApplied && {
          action: (
            <Button color="inherit" size="small" onClick={onRetry}>
              {PICK_RETRY_LABEL}
            </Button>
          ),
        })}
      >
        {shown.message}
      </Alert>
    </Collapse>
  );
};
