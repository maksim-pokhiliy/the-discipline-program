import { defaultMonitoring } from "../../../infrastructure/monitoring";

export type DeleteImage = (url: string) => Promise<unknown>;

export const deleteDroppedPhoto = async (
  deleteImage: DeleteImage,
  productId: string,
  previous: string | null,
  next: string | null | undefined,
): Promise<void> => {
  if (previous === null || next === undefined || next === previous) {
    return;
  }

  try {
    await deleteImage(previous);
  } catch (error) {
    defaultMonitoring.captureException(error, {
      level: "warning",
      tags: { area: "cms.product.photo", productId },
      extra: { imageUrl: previous },
    });
  }
};
