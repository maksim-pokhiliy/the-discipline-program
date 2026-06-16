"use client";

import { type ChangeEvent, useRef } from "react";

import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { Avatar, Box, CircularProgress, IconButton } from "@mui/material";

import { UPLOAD_CONFIG } from "@repo/contracts/storage/upload";

const AVATAR_SIZE_PX = 96;
const CHANGE_BUTTON_SIZE_PX = 44;

type ProfileAvatarProps = {
  name: string | null;
  email: string;
  image: string | null;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
};

const resolveInitial = (name: string | null, email: string): string => {
  const source = name?.trim() || email.trim();

  return source.charAt(0).toUpperCase();
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  email,
  image,
  isUploading,
  onFileSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelect(file);
      event.target.value = "";
    }
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  return (
    <Box sx={{ position: "relative", width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX }}>
      <Avatar
        {...(image && { src: image })}
        alt={name?.trim() || email}
        sx={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX, fontSize: AVATAR_SIZE_PX * 0.4 }}
      >
        {resolveInitial(name, email)}
      </Avatar>

      {isUploading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "action.disabledBackground",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      <input
        type="file"
        hidden
        ref={inputRef}
        accept={UPLOAD_CONFIG.avatar.acceptedTypes.join(",")}
        onChange={handleChange}
        disabled={isUploading}
        aria-label="Change avatar"
      />

      <IconButton
        onClick={triggerSelect}
        disabled={isUploading}
        aria-label="Change avatar"
        size="small"
        sx={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: CHANGE_BUTTON_SIZE_PX,
          height: CHANGE_BUTTON_SIZE_PX,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",

          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <PhotoCameraIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
