"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  ButtonBase,
  IconButton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import type { CoachCredential } from "@repo/contracts/coaching/coach-credential";

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
  const isShown = credential.shownToAthletes;

  return (
    <Stack
      direction="row"
      spacing={1.75}
      alignItems="center"
      sx={{
        px: 1.75,
        py: 1.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create("background-color"),

        "&:first-of-type": { borderTop: "none" },
        "&:hover": { bgcolor: theme.palette.action.hover },
      }}
    >
      <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
          {credential.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" noWrap>
          {credential.issuer} · {credential.year}
        </Typography>
      </Stack>

      <ButtonBase
        onClick={() => onToggleShown(!isShown)}
        disabled={isMutating}
        aria-label={isShown ? "Hide from athletes" : "Show to athletes"}
        sx={{
          height: 24,
          flexShrink: 0,
          gap: 0.5,
          justifyContent: "center",
          ...(isCompact ? { width: 32 } : { px: 1 }),
          borderRadius: 1,
          border: `1px solid ${isShown ? alpha(theme.palette.primary.main, 0.4) : theme.palette.divider}`,
          color: isShown ? "primary.main" : "text.muted",
          bgcolor: isShown ? alpha(theme.palette.primary.main, 0.08) : "transparent",
          typography: "overline",
          transition: theme.transitions.create(["color", "border-color", "background-color"]),

          "&:hover": {
            color: isShown ? "primary.main" : "text.primary",
            borderColor: isShown ? theme.palette.primary.main : theme.palette.dividerStrong,
          },
        }}
      >
        {isShown ? (
          <VisibilityIcon sx={{ fontSize: 14 }} />
        ) : (
          <VisibilityOffIcon sx={{ fontSize: 14 }} />
        )}

        {!isCompact && (isShown ? "Shown" : "Hidden")}
      </ButtonBase>

      <IconButton
        onClick={onDelete}
        disabled={isMutating}
        aria-label="Delete credential"
        color="error"
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};
