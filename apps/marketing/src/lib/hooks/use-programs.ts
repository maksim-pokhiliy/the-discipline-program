import { marketingKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const usePrograms = () =>
  useQuery({
    queryKey: marketingKeys.programs.all(),
    queryFn: api.programs.getAll,
  });
