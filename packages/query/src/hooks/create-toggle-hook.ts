"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyError } from "./notify-error";

type ToggleHookConfig<TResponse> = {
  mutationFn: (id: string) => Promise<TResponse>;
  successMessage: string;
  errorMessage: string;
  invalidateKeys: QueryKey[];
};

export const createToggleHook = <TResponse>(config: ToggleHookConfig<TResponse>) => {
  return () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: config.mutationFn,
      onSuccess: () => {
        toast.success(config.successMessage);
        for (const key of config.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      },
      onError: (error: Error) => {
        notifyError(error, config.errorMessage);
      },
    });
  };
};
