import { type ReactElement } from "react";

import { Box, Stack } from "@mui/material";

import { type SessionDetailResponse } from "@repo/contracts/lms/session-detail";
import { PageHeader } from "@repo/ui";

import { formatCompletedDate } from "../utils/athlete-session-presentation";
import {
  BLOCK_GAP_PX,
  CONTENT_PAD_TOP,
  CONTENT_PAD_X,
  RAIL_PADDING_X_PX,
  RAIL_PADDING_Y_PX,
  RAIL_WIDTH_PX,
} from "../utils/athlete-session.constants";
import { type SessionEditorControls, useSessionLogging } from "../utils/use-session-logging";
import { useWeightSheet } from "../utils/use-weight-sheet";

import { CompletionBar } from "./completion-bar";
import { CompletionRail } from "./completion-rail";
import { CompletionSheet } from "./completion-sheet";
import { SessionBlock } from "./session-block";
import { SessionMetaHeader } from "./session-meta-header";
import { WeightSourceSheet } from "./weight-source-sheet";

export type SessionContentProps = {
  data: SessionDetailResponse;
};

const BACK_HREF = "/athlete";

export const SessionContent = ({ data }: SessionContentProps): ReactElement => {
  const { session, blocks } = data;
  const logging = useSessionLogging(data);
  const weightSheet = useWeightSheet(data);

  const completedLabel =
    session.completedAt !== null ? formatCompletedDate(session.completedAt) : null;

  const editor: SessionEditorControls = {
    activeLogSchemaId: logging.activeLogSchemaId,
    isLoggingBenchmark: logging.isLoggingBenchmark,
    pulsingRowIds: weightSheet.pulsingRowIds,
    draftFor: logging.draftFor,
    openLog: logging.openLog,
    cancelLog: logging.cancelLog,
    saveLog: logging.saveLog,
    setDraftField: logging.setDraftField,
    openWeightSheet: weightSheet.openWeightSheet,
  };

  const workout = (
    <Stack spacing={2.5}>
      <PageHeader backHref={BACK_HREF} title={session.planTitle} />
      <SessionMetaHeader session={session} />
      <Stack spacing={`${BLOCK_GAP_PX}px`}>
        {blocks.map((block) => (
          <SessionBlock key={block.blockId} block={block} editor={editor} />
        ))}
      </Stack>
    </Stack>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100%",
        width: "100%",
      }}
    >
      <Box
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
          px: CONTENT_PAD_X,
          pt: CONTENT_PAD_TOP,
          pb: {
            xs: `calc(${theme.layout.platformBottomNavHeight}px + ${theme.spacing(16)} + env(safe-area-inset-bottom))`,
            md: `calc(${theme.spacing(16)} + env(safe-area-inset-bottom))`,
          },
        })}
      >
        {workout}
      </Box>

      <Box
        component="aside"
        sx={(theme) => ({
          display: { xs: "none", md: "block" },
          width: `${RAIL_WIDTH_PX}px`,
          flexShrink: 0,
          height: "100%",
          overflowY: "auto",
          borderLeft: `1px solid ${theme.palette.divider}`,
          px: `${RAIL_PADDING_X_PX}px`,
          pt: `${RAIL_PADDING_Y_PX}px`,
          pb: `calc(${theme.spacing(16)} + env(safe-area-inset-bottom))`,
        })}
      >
        <CompletionRail
          isLoggingState={logging.isLoggingState}
          completedLabel={completedLabel}
          benchmarks={logging.benchmarks}
          note={logging.note}
          isSubmitting={logging.isSubmitting}
          onNote={logging.setNote}
          onConfirm={logging.confirm}
          onReopen={logging.reopen}
        />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box
          sx={(theme) => ({
            position: "fixed",
            left: 0,
            right: 0,
            bottom: `calc(${theme.layout.platformBottomNavHeight}px + env(safe-area-inset-bottom))`,
            zIndex: theme.zIndex.appBar,
          })}
        >
          <CompletionBar
            isLoggingState={logging.isLoggingState}
            completedLabel={completedLabel}
            onOpenSheet={logging.openSheet}
            onReopen={logging.reopen}
          />
        </Box>
        <CompletionSheet
          open={logging.isSheetOpen}
          benchmarks={logging.benchmarks}
          note={logging.note}
          isSubmitting={logging.isSubmitting}
          onClose={logging.closeSheet}
          onNote={logging.setNote}
          onConfirm={logging.confirm}
        />
      </Box>

      <WeightSourceSheet {...weightSheet.controls} />
    </Box>
  );
};
