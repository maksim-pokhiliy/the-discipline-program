"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import type { CoachCredential } from "@repo/contracts/coaching/coach-credential";

const ROW_MIN_HEIGHT_PX = 56;

type CredentialRowProps = {
  credential: CoachCredential;
  isMutating: boolean;
  onToggleShown: (shownToAthletes: boolean) => void;
  onDelete: () => void;
};

export const CredentialRow: React.FC<CredentialRowProps> = ({
  credential,
  isMutating,
  onToggleShown,
  onDelete,
}) => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack
      direction={isCompact ? "column" : "row"}
      spacing={1.5}
      alignItems={isCompact ? "flex-start" : "center"}
      justifyContent="space-between"
      sx={{ minHeight: ROW_MIN_HEIGHT_PX, py: 1 }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {credential.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" noWrap>
          {credential.issuer} · {credential.year}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={credential.shownToAthletes}
              disabled={isMutating}
              onChange={(event) => onToggleShown(event.target.checked)}
            />
          }
          label="Shown to athletes"
          slotProps={{ typography: { variant: "body2", color: "text.secondary" } }}
        />

        <IconButton
          onClick={onDelete}
          disabled={isMutating}
          aria-label="Delete credential"
          color="error"
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
};
