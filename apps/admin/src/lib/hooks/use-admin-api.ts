import { Program, AdminProgramsPageData } from "@repo/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api";

export const useAdminApi = {
  useDashboardData: () =>
    useQuery({
      queryKey: ["admin", "dashboard"],
      queryFn: adminApi.dashboard.getData,
    }),

  useProgramsPageData: () =>
    useQuery({
      queryKey: ["admin", "programs", "page-data"],
      queryFn: adminApi.programs.getPageData,
    }),

  usePrograms: () =>
    useQuery({
      queryKey: ["admin", "programs"],
      queryFn: adminApi.programs.getAll,
    }),

  useProgramsStats: () =>
    useQuery({
      queryKey: ["admin", "programs", "stats"],
      queryFn: adminApi.programs.getStats,
    }),

  useProgram: (id: string) =>
    useQuery({
      queryKey: ["admin", "programs", id],
      queryFn: () => adminApi.programs.getById(id),
      enabled: !!id,
    }),

  useProgramMutations: () => {
    const queryClient = useQueryClient();

    const invalidatePrograms = () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    };

    const createProgram = useMutation({
      mutationFn: adminApi.programs.create,
      onSuccess: invalidatePrograms,
    });

    const updateProgram = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Program> }) =>
        adminApi.programs.update(id, data),
      onSuccess: invalidatePrograms,
    });

    const deleteProgram = useMutation({
      mutationFn: adminApi.programs.delete,
      onSuccess: invalidatePrograms,
    });

    const toggleStatus = useMutation({
      mutationFn: adminApi.programs.toggleStatus,
      onSuccess: invalidatePrograms,
    });

    const updateProgramsOrder = useMutation({
      mutationFn: async (reorderedPrograms: Program[]) => {
        const updates = reorderedPrograms.map((program, index) => ({
          id: program.id,
          sortOrder: index + 1,
        }));

        await Promise.all(
          updates.map((update) =>
            adminApi.programs.update(update.id, { sortOrder: update.sortOrder }),
          ),
        );

        return reorderedPrograms;
      },

      onMutate: async (reorderedPrograms: Program[]) => {
        await queryClient.cancelQueries({ queryKey: ["admin", "programs"] });

        const previousPageData = queryClient.getQueryData<AdminProgramsPageData>([
          "admin",
          "programs",
          "page-data",
        ]);

        const previousPrograms = queryClient.getQueryData<Program[]>(["admin", "programs"]);

        const updatedPrograms = reorderedPrograms.map((program, index) => ({
          ...program,
          sortOrder: index + 1,
        }));

        queryClient.setQueryData<AdminProgramsPageData>(
          ["admin", "programs", "page-data"],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              programs: updatedPrograms,
            };
          },
        );

        queryClient.setQueryData<Program[]>(["admin", "programs"], updatedPrograms);

        return { previousPageData, previousPrograms };
      },

      onError: (error, _, context) => {
        if (context?.previousPageData) {
          queryClient.setQueryData(["admin", "programs", "page-data"], context.previousPageData);
        }

        if (context?.previousPrograms) {
          queryClient.setQueryData(["admin", "programs"], context.previousPrograms);
        }

        console.error("Failed to update programs order:", error);
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      },
    });

    return {
      createProgram,
      updateProgram,
      deleteProgram,
      toggleStatus,
      updateProgramsOrder,
    };
  },

  useReviews: () =>
    useQuery({
      queryKey: ["admin", "reviews"],
      queryFn: adminApi.reviews.getAll,
    }),

  useContacts: () =>
    useQuery({
      queryKey: ["admin", "contacts"],
      queryFn: adminApi.contacts.getAll,
    }),
};

export const useDashboardData = useAdminApi.useDashboardData;
export const useProgramsPageData = useAdminApi.useProgramsPageData;
export const usePrograms = useAdminApi.usePrograms;
export const useProgramsStats = useAdminApi.useProgramsStats;
export const useProgram = useAdminApi.useProgram;
export const useProgramMutations = useAdminApi.useProgramMutations;
export const useReviews = useAdminApi.useReviews;
export const useContacts = useAdminApi.useContacts;
