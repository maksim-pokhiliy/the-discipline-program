import { type ReactElement } from "react";

import { Box, Stack } from "@mui/material";

import { type SessionDetailResponse } from "@repo/contracts/lms/session-detail";
import { PageHeader } from "@repo/ui";

import { formatCompletedDate } from "../utils/athlete-session-presentation";
import {
  BLOCK_GAP_PX,
  CONTENT_BOTTOM_SPACER_PX,
  CONTENT_MAX_WIDTH_PX,
  RAIL_PADDING_X_PX,
  RAIL_PADDING_Y_PX,
  RAIL_WIDTH_PX,
} from "../utils/athlete-session.constants";

import { CompletionBar } from "./completion-bar";
import { CompletionRail } from "./completion-rail";
import { SessionBlock } from "./session-block";
import { SessionMetaHeader } from "./session-meta-header";

export type SessionContentProps = {
  data: SessionDetailResponse;
  onSetOneRm: (exerciseId: string) => void;
  onPickProfile: (rowId: string) => void;
  onComplete: () => void;
  onReopen: () => void;
};

const BACK_HREF = "/athlete";

export const SessionContent = ({
  data,
  onSetOneRm,
  onPickProfile,
  onComplete,
  onReopen,
}: SessionContentProps): ReactElement => {
  const { session, blocks } = data;
  const completedLabel =
    session.completedAt !== null ? formatCompletedDate(session.completedAt) : null;

  const workout = (
    <Stack spacing={2.5}>
      <PageHeader backHref={BACK_HREF} title={session.planTitle} />
      <SessionMetaHeader session={session} />
      <Stack spacing={`${BLOCK_GAP_PX}px`}>
        {blocks.map((block) => (
          <SessionBlock
            key={block.blockId}
            block={block}
            onSetOneRm={onSetOneRm}
            onPickProfile={onPickProfile}
          />
        ))}
      </Stack>
    </Stack>
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: { md: 4 } }}>
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: { md: CONTENT_MAX_WIDTH_PX } }}>{workout}</Box>
        <Box
          component="aside"
          sx={(theme) => ({
            display: { xs: "none", md: "block" },
            flex: `0 0 ${RAIL_WIDTH_PX}px`,
            position: "sticky",
            top: theme.spacing(3),
            px: `${RAIL_PADDING_X_PX}px`,
            py: `${RAIL_PADDING_Y_PX}px`,
            borderLeft: `1px solid ${theme.palette.divider}`,
          })}
        >
          <CompletionRail
            done={session.done}
            completedLabel={completedLabel}
            onComplete={onComplete}
            onReopen={onReopen}
          />
        </Box>
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box sx={{ height: `${CONTENT_BOTTOM_SPACER_PX}px` }} />
        <Box
          sx={(theme) => ({
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
          })}
        >
          <CompletionBar
            done={session.done}
            completedLabel={completedLabel}
            onComplete={onComplete}
            onReopen={onReopen}
          />
        </Box>
      </Box>
    </Box>
  );
};
