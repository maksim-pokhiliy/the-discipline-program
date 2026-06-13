"use client";

import { useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

const SUCCESS_MESSAGE = "Group deleted";

type RunArgs = {
  members: SchemaRow[];
};

export type UseDeleteRowGroupWithMembersResult = {
  run: (args: RunArgs) => Promise<void>;
  isPending: boolean;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const partialFailureMessage = (deletedCount: number, total: number, reason: string): string =>
  `Deleted ${deletedCount} of ${total} rows; the rest stay a valid group: ${reason}`;

export const useDeleteRowGroupWithMembers = (
  planId: string,
  startDate: string,
): UseDeleteRowGroupWithMembersResult => {
  const queryClient = useQueryClient();
  const isRunningRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const run = async ({ members }: RunArgs): Promise<void> => {
    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;
    setIsPending(true);

    let failureMessage: string | null = null;
    let deletedCount = 0;

    try {
      for (const member of members) {
        try {
          await api.schemaRows.delete(planId, member.id);
          deletedCount += 1;
        } catch (error) {
          failureMessage = toErrorMessage(error);
          break;
        }
      }
    } finally {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      setIsPending(false);
      isRunningRef.current = false;
    }

    if (failureMessage !== null) {
      toast.error(partialFailureMessage(deletedCount, members.length, failureMessage));

      return;
    }

    toast.success(SUCCESS_MESSAGE);
  };

  return { run, isPending };
};
