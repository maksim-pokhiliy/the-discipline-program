"use client";

import type { AdminProgramsPageData, Program } from "@repo/api";
import { adminKeys, createPageDataCrudHooks } from "@repo/query";

import { api } from "../api";

const programs = createPageDataCrudHooks<AdminProgramsPageData, Program, "programs", "stats">({
  keys: {
    page: adminKeys.programs.page,
    byId: adminKeys.programs.byId,
    invalidate: () => [adminKeys.dashboard()],
  },
  api: {
    getPageData: api.programs.getPageData,
    getById: api.programs.getById,
    create: api.programs.create,
    update: api.programs.update,
    delete: api.programs.delete,
    toggle: api.programs.toggleStatus,
    updateOrder: api.programs.updateOrder,
  },
  fields: {
    items: "programs",
    stats: "stats",
  },
});

export const useProgramsPageData = programs.usePageData;

export const usePrograms = programs.useItems;

export const useProgramsStats = programs.useStats;

export const useProgram = programs.useById;

export const useProgramMutations = () => {
  const { createItem, updateItem, deleteItem, toggleItem, updateOrder } = programs.useMutations();

  return {
    createProgram: createItem,
    updateProgram: updateItem,
    deleteProgram: deleteItem,
    toggleStatus: toggleItem,
    updateProgramsOrder: updateOrder,
  };
};
