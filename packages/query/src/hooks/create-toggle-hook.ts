"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

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
        toast.error(error.message || config.errorMessage);
      },
    });
  };
};
