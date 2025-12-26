import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const cancelMany = async (queryClient: QueryClient, keys: QueryKey[]) => {
  await Promise.all(keys.map((k) => queryClient.cancelQueries({ queryKey: k })));
};

export const invalidateMany = async (
  queryClient: QueryClient,
  keys: QueryKey[],
  options?: { exact?: boolean },
) => {
  await Promise.all(
    keys.map((k) =>
      queryClient.invalidateQueries({
        queryKey: k,
        exact: options?.exact ?? false,
      }),
    ),
  );
};
