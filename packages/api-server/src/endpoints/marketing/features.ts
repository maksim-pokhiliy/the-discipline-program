import { type Feature } from "@repo/contracts/feature";

import { prisma } from "../../db/client";

export const featuresApi = {
  getFeatures: async (): Promise<Feature[]> => {
    const features = await prisma.feature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return features;
  },
};
