"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import { type GeneralMobileLink, partitionMobileLinks } from "@repo/contracts/coaching/mobile-link";
import { BaseModal, ConfirmationModal, EmptyState } from "@repo/ui";

import { isReconnectRequired } from "@app/lib/api/is-reconnect-required";
import {
  useCreateMobileLink,
  useDeleteMobileLink,
  useMobileConnections,
  useMobileLinks,
  useTrainingLevels,
} from "@app/lib/hooks";

import { ConnectMobileModal } from "../../coach-profile/components";

import { GeneralLinkRow } from "./general-link-row";
import { IndividualLinksSection } from "./individual-links-section";

type ManageMobileLinksModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  weekStart: string;
};

const MODAL_TITLE = "Mobile publishing";
const NOT_CONNECTED_MESSAGE = "Connect your mobile app to publish plans to a training level.";
const RECONNECT_MESSAGE = "Connection expired. Reconnect to manage training levels.";
const NO_LINKS_MESSAGE = "No training levels linked yet.";
const ALL_LINKED_MESSAGE = "Every training level is already linked.";
const LEVELS_ERROR_MESSAGE = "Couldn't load training levels. Try again.";
const LINKS_ERROR_MESSAGE = "Couldn't load what this plan is linked to. Try again.";
const RECONNECT_TITLE = "Reconnect mobile app";
const NO_LEVEL_SELECTED = "";
const TRAINING_LEVELS_HEADING = "Training levels";
const ATHLETES_HEADING = "Athletes";

export const ManageMobileLinksModal: React.FC<ManageMobileLinksModalProps> = ({
  open,
  onClose,
  planId,
  weekStart,
}) => {
  const connectionsQuery = useMobileConnections();
  const isConnected = (connectionsQuery.data ?? []).length > 0;

  const levelsQuery = useTrainingLevels(isConnected);
  const linksQuery = useMobileLinks(planId, weekStart);

  const createLink = useCreateMobileLink(planId);
  const deleteLink = useDeleteMobileLink(planId);

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(NO_LEVEL_SELECTED);
  const [pendingDelete, setPendingDelete] = useState<GeneralMobileLink | null>(null);

  const levels = useMemo<LegacyTrainingLevel[]>(() => levelsQuery.data ?? [], [levelsQuery.data]);
  const { general: links, individual: individualLinks } = useMemo(
    () => partitionMobileLinks(linksQuery.data ?? []),
    [linksQuery.data],
  );

  const levelNameById = useMemo(
    () => new Map(levels.map((level) => [level.id, level.name])),
    [levels],
  );

  const levelLabelFor = (link: GeneralMobileLink): string =>
    levelNameById.get(link.legacyLevelId) ?? `Level ${link.legacyLevelId}`;

  const linkedLevelIds = useMemo(() => new Set(links.map((link) => link.legacyLevelId)), [links]);

  const unlinkedLevels = useMemo(
    () => levels.filter((level) => !linkedLevelIds.has(level.id)),
    [levels, linkedLevelIds],
  );

  const isReconnect = levelsQuery.error !== null && isReconnectRequired(levelsQuery.error);
  const hasLevelsError = levelsQuery.isError && !isReconnect;
  const isLoading =
    connectionsQuery.isPending || (isConnected && (levelsQuery.isPending || linksQuery.isPending));

  const handleAdd = () => {
    if (selectedLevelId === NO_LEVEL_SELECTED) {
      return;
    }

    const legacyLevelId = Number(selectedLevelId);

    if (!Number.isInteger(legacyLevelId)) {
      return;
    }

    createLink.mutate(
      { planId, legacyLevelId },
      { onSuccess: () => setSelectedLevelId(NO_LEVEL_SELECTED) },
    );
  };

  const handleConfirmDelete = () => {
    if (pendingDelete === null) {
      return;
    }

    deleteLink.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={24} />
        </Stack>
      );
    }

    if (!isConnected) {
      return (
        <EmptyState
          message={NOT_CONNECTED_MESSAGE}
          action={{ label: "Connect mobile app", onClick: () => setIsConnectOpen(true) }}
        />
      );
    }

    if (isReconnect) {
      return (
        <Stack spacing={2}>
          <Alert severity="warning">{RECONNECT_MESSAGE}</Alert>

          <Button variant="contained" onClick={() => setIsConnectOpen(true)}>
            Reconnect
          </Button>
        </Stack>
      );
    }

    if (linksQuery.isError) {
      return <Alert severity="error">{LINKS_ERROR_MESSAGE}</Alert>;
    }

    return (
      <Stack spacing={2.5}>
        <Typography variant="overline" color="text.secondary">
          {TRAINING_LEVELS_HEADING}
        </Typography>

        {links.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {NO_LINKS_MESSAGE}
          </Typography>
        ) : (
          <Stack
            divider={<Divider flexItem />}
            sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            {links.map((link) => (
              <GeneralLinkRow
                key={link.id}
                link={link}
                label={levelLabelFor(link)}
                onUnlink={() => setPendingDelete(link)}
              />
            ))}
          </Stack>
        )}

        {hasLevelsError ? (
          <Alert severity="error">{LEVELS_ERROR_MESSAGE}</Alert>
        ) : (
          <>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControl fullWidth size="small" disabled={unlinkedLevels.length === 0}>
                <InputLabel id="add-training-level-label">Training level</InputLabel>

                <Select
                  labelId="add-training-level-label"
                  label="Training level"
                  value={selectedLevelId}
                  onChange={(event) => setSelectedLevelId(event.target.value)}
                >
                  {unlinkedLevels.map((level) => (
                    <MenuItem key={level.id} value={String(level.id)}>
                      {level.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={selectedLevelId === NO_LEVEL_SELECTED || createLink.isPending}
              >
                Add
              </Button>
            </Stack>

            {unlinkedLevels.length === 0 && links.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {ALL_LINKED_MESSAGE}
              </Typography>
            )}
          </>
        )}

        <Divider />

        <Typography variant="overline" color="text.secondary">
          {ATHLETES_HEADING}
        </Typography>

        <IndividualLinksSection
          planId={planId}
          isConnected={isConnected}
          individualLinks={individualLinks}
        />
      </Stack>
    );
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title={MODAL_TITLE}
        actions={
          <Button variant="text" onClick={onClose}>
            Done
          </Button>
        }
      >
        {renderBody()}
      </BaseModal>

      <ConnectMobileModal
        open={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onConnected={() => setIsConnectOpen(false)}
        {...(isReconnect && { title: RECONNECT_TITLE })}
      />

      <ConfirmationModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        type="danger"
        title="Unlink training level?"
        confirmText="Unlink"
        message={
          pendingDelete === null
            ? ""
            : `Stop publishing this plan to ${levelLabelFor(pendingDelete)}?`
        }
        isConfirming={deleteLink.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
