"use client";

import PersonIcon from "@mui/icons-material/Person";
import { CardMedia, Stack } from "@mui/material";

type PersonCardImageSlotProps = {
  image: string | null;
  name: string;
};

export const PersonCardImageSlot: React.FC<PersonCardImageSlotProps> = ({ image, name }) =>
  image ? (
    <CardMedia
      component="img"
      image={image}
      alt={name}
      sx={(theme) => ({ width: theme.spacing(18), objectFit: "cover" })}
    />
  ) : (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={(theme) => ({
        width: theme.spacing(18),
        minHeight: theme.spacing(18),
        bgcolor: "action.hover",
      })}
    >
      <PersonIcon fontSize="large" sx={{ color: "text.muted" }} />
    </Stack>
  );
