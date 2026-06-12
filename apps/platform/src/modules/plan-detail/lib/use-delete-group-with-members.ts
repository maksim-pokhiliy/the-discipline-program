"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

const SUCCESS_MESSAGE = "Group deleted";

type RunArgs = {
  members: SchemaWithBody[];
};

export type UseDeleteGroupWithMembersResult = {
  run: (args: RunArgs) => Promise<void>;
  isPending: boolean;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const partialFailureMessage = (deletedCount: number, total: number, reason: string): string =>
  `Deleted ${deletedCount} of ${total} schemas; the rest stay a valid group: ${reason}`;

export const useDeleteGroupWithMembers = (
  planId: string,
  startDate: string,
): UseDeleteGroupWithMembersResult => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const run = async ({ members }: RunArgs): Promise<void> => {
    setIsPending(true);

    let failureMessage: string | null = null;
    let deletedCount = 0;

    try {
      for (const member of members) {
        try {
          await api.schemas.delete(planId, member.schema.id);
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
    }

    if (failureMessage !== null) {
      toast.error(partialFailureMessage(deletedCount, members.length, failureMessage));

      return;
    }

    toast.success(SUCCESS_MESSAGE);
  };

  return { run, isPending };
};
