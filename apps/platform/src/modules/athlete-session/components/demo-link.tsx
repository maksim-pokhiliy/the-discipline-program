import { type ReactElement } from "react";

import PlayCircleOutlineRounded from "@mui/icons-material/PlayCircleOutlineRounded";
import { Link } from "@mui/material";

import { DEMO_ICON_PX, DEMO_LINK_ARIA } from "../utils/athlete-session.constants";

export type DemoLinkProps = {
  url: string;
};

export const DemoLink = ({ url }: DemoLinkProps): ReactElement => (
  <Link
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    underline="none"
    aria-label={DEMO_LINK_ARIA}
    onClick={(event) => event.stopPropagation()}
    sx={(theme) => ({
      display: "inline-flex",
      flexShrink: 0,
      alignSelf: "center",
      color: theme.palette.text.muted,
      transition: theme.transitions.create("color"),
      "&:hover": { color: theme.palette.primary.main },
    })}
  >
    <PlayCircleOutlineRounded sx={{ fontSize: DEMO_ICON_PX }} />
  </Link>
);
