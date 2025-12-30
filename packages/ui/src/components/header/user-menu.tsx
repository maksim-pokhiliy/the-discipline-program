"use client";

import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export const UserMenu = () => {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <IconButton onClick={handleClick} size="large" color="inherit">
        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
          <AccountCircleIcon />
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Admin User
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {session.user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LogoutIcon fontSize="small" />
            <Typography>Logout</Typography>
          </Stack>
        </MenuItem>
      </Menu>
    </>
  );
};
