import { type ReactNode } from "react";

import EventNoteRounded from "@mui/icons-material/EventNoteRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import LeaderboardRounded from "@mui/icons-material/LeaderboardRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";

import { type PlatformIconName } from "@repo/shared";

export const PLATFORM_NAV_ICONS: Record<PlatformIconName, ReactNode> = {
  home: <HomeRounded />,
  plans: <EventNoteRounded />,
  athletes: <GroupRounded />,
  profile: <PersonRounded />,
  leaderboard: <LeaderboardRounded />,
};
