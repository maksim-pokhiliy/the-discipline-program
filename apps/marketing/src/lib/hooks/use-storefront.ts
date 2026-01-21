import { useQuery } from "@tanstack/react-query";

import { marketingKeys } from "@repo/query";

import { api } from "../api";

export const useStorefrontPrograms = () =>
  useQuery({
    queryKey: marketingKeys.storefront.all(),
    queryFn: api.storefront.getAll,
  });
