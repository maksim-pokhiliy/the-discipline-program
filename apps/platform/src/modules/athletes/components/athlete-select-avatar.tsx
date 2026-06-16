"use client";

import { Avatar, Box, Checkbox } from "@mui/material";
import { alpha } from "@mui/material/styles";

export const SELECT_OVERLAY_CLASS = "athlete-select-overlay";

const SCRIM_ALPHA = 0.45;

type AthleteSelectAvatarProps = {
  name: string;
  image: string | null;
  size: number;
  fontSize: number;
  checked: boolean;
  onToggle: () => void;
};

export const AthleteSelectAvatar: React.FC<AthleteSelectAvatarProps> = ({
  name,
  image,
  size,
  fontSize,
  checked,
  onToggle,
}) => (
  <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <Avatar
      {...(image && { src: image })}
      alt={name}
      sx={{ width: size, height: size, fontSize, ...(checked && { visibility: "hidden" }) }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>

    <Box
      className={SELECT_OVERLAY_CLASS}
      sx={(theme) => ({
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: checked ? "transparent" : alpha(theme.palette.background.default, SCRIM_ALPHA),
        opacity: checked ? 1 : 0,
        pointerEvents: checked ? "auto" : "none",
        transition: theme.transitions.create("opacity"),
      })}
    >
      <Checkbox
        checked={checked}
        onChange={onToggle}
        onClick={(event) => event.stopPropagation()}
      />
    </Box>
  </Box>
);
