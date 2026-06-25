"use client";

import { useMemo, useState } from "react";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import type { MobileLink } from "@repo/contracts/coaching/mobile-link";
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

type ManageMobileLinksModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
};

const MODAL_TITLE = "Mobile publishing";
const NOT_CONNECTED_MESSAGE = "Connect your mobile app to publish plans to a training level.";
const RECONNECT_MESSAGE = "Connection expired. Reconnect to manage training levels.";
const NO_LINKS_MESSAGE = "No training levels linked yet.";
const ALL_LINKED_MESSAGE = "Every training level is already linked.";
const RECONNECT_TITLE = "Reconnect mobile app";
const NO_LEVEL_SELECTED = "";

export const ManageMobileLinksModal: React.FC<ManageMobileLinksModalProps> = ({
  open,
  onClose,
  planId,
}) => {
  const connectionsQuery = useMobileConnections();
  const isConnected = (connectionsQuery.data ?? []).length > 0;

  const levelsQuery = useTrainingLevels(isConnected);
  const linksQuery = useMobileLinks(planId);

  const createLink = useCreateMobileLink(planId);
  const deleteLink = useDeleteMobileLink(planId);

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(NO_LEVEL_SELECTED);
  const [pendingDelete, setPendingDelete] = useState<MobileLink | null>(null);

  const levels = useMemo<LegacyTrainingLevel[]>(() => levelsQuery.data ?? [], [levelsQuery.data]);
  const links = useMemo<MobileLink[]>(() => linksQuery.data ?? [], [linksQuery.data]);

  const levelNameById = useMemo(
    () => new Map(levels.map((level) => [level.id, level.name])),
    [levels],
  );

  const linkedLevelIds = useMemo(() => new Set(links.map((link) => link.legacyLevelId)), [links]);

  const unlinkedLevels = useMemo(
    () => levels.filter((level) => !linkedLevelIds.has(level.id)),
    [levels, linkedLevelIds],
  );

  const isReconnect = levelsQuery.error !== null && isReconnectRequired(levelsQuery.error);
  const isLoading = connectionsQuery.isPending || (isConnected && levelsQuery.isPending);

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

    return (
      <Stack spacing={2.5}>
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
              <Stack
                key={link.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{ px: 1.5, py: 1 }}
              >
                <Typography variant="body2">
                  {levelNameById.get(link.legacyLevelId) ?? `Level ${link.legacyLevelId}`}
                </Typography>

                <IconButton
                  aria-label="Unlink training level"
                  size="small"
                  onClick={() => setPendingDelete(link)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}

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
            : `Stop publishing this plan to ${
                levelNameById.get(pendingDelete.legacyLevelId) ??
                `Level ${pendingDelete.legacyLevelId}`
              }?`
        }
        isConfirming={deleteLink.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
