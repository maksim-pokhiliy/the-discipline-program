import { randomUUID } from "node:crypto";

import { type ProductFeature, type ProductFeatureWrite } from "@repo/contracts/cms/product";
import { BadRequestError } from "@repo/errors";

export const withFeatureIds = (features: readonly ProductFeatureWrite[]): ProductFeature[] => {
  const ids = new Set<string>();

  for (const { id } of features) {
    if (!id) {
      continue;
    }

    if (ids.has(id)) {
      throw new BadRequestError(`Two features of the product share the id ${id}`, {
        list: "features",
        id,
      });
    }

    ids.add(id);
  }

  return features.map((feature) => ({ ...feature, id: feature.id || randomUUID() }));
};
