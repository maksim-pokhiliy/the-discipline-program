"use client";

import { type ChangeEvent, useRef } from "react";

import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, ButtonBase, CircularProgress, Stack, alpha } from "@mui/material";

import { UPLOAD_CONFIG } from "@repo/contracts/storage/upload";

const AVATAR_SIZE_PX = 96;
const INITIALS_FONT_SIZE_PX = 40;
const OVERLAY_ICON_SIZE_PX = 18;
const OVERLAY_LABEL_FONT_SIZE_PX = 9.5;
const OVERLAY_SCRIM_OPACITY = 0.55;

type ProfileAvatarProps = {
  name: string | null;
  email: string;
  image: string | null;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
};

const resolveInitials = (name: string | null, email: string): string => {
  const source = name?.trim() || email.trim();
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");

  return initials.toUpperCase() || "?";
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  email,
  image,
  isUploading,
  onFileSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageSrc = image ?? undefined;
  const hasImage = imageSrc !== undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelect(file);
      event.target.value = "";
    }
  };

  return (
    <ButtonBase
      onClick={() => inputRef.current?.click()}
      disabled={isUploading}
      aria-label={hasImage ? "Change avatar" : "Add avatar"}
      sx={(theme) => ({
        position: "relative",
        flexShrink: 0,
        width: AVATAR_SIZE_PX,
        height: AVATAR_SIZE_PX,
        borderRadius: "50%",
        overflow: "hidden",
        fontFamily: theme.typography.h2.fontFamily,
        fontWeight: 700,
        fontSize: INITIALS_FONT_SIZE_PX,
        letterSpacing: "-0.02em",
        color: hasImage ? theme.palette.primary.contrastText : theme.palette.text.muted,
        bgcolor: hasImage ? theme.palette.primary.main : theme.palette.background.default,
        ...(!hasImage && { border: `1px dashed ${theme.palette.divider}` }),
        transition: theme.transitions.create(["border-color", "color"]),

        "&:hover": {
          ...(!hasImage && {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
          }),
        },

        "&:hover .avatar-overlay, &.Mui-focusVisible .avatar-overlay": { opacity: 1 },
      })}
    >
      {hasImage ? (
        <Box
          component="img"
          src={imageSrc}
          alt={name?.trim() || email}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        resolveInitials(name, email)
      )}

      {isUploading ? (
        <Box
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.common.black, OVERLAY_SCRIM_OPACITY),
          })}
        >
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Stack
          className="avatar-overlay"
          alignItems="center"
          justifyContent="center"
          spacing={0.25}
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            color: theme.palette.common.white,
            bgcolor: alpha(theme.palette.common.black, OVERLAY_SCRIM_OPACITY),
            opacity: 0,
            transition: theme.transitions.create("opacity"),
          })}
        >
          {hasImage ? (
            <EditOutlinedIcon sx={{ fontSize: OVERLAY_ICON_SIZE_PX }} />
          ) : (
            <AddAPhotoOutlinedIcon sx={{ fontSize: OVERLAY_ICON_SIZE_PX }} />
          )}

          <Box
            component="span"
            sx={{
              fontSize: OVERLAY_LABEL_FONT_SIZE_PX,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {hasImage ? "Change" : "Add"}
          </Box>
        </Stack>
      )}

      <input
        type="file"
        hidden
        ref={inputRef}
        accept={UPLOAD_CONFIG.avatar.acceptedTypes.join(",")}
        onChange={handleChange}
        disabled={isUploading}
        tabIndex={-1}
        aria-hidden
      />
    </ButtonBase>
  );
};
