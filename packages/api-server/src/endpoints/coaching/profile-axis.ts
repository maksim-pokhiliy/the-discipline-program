import { Prisma } from "@prisma/client";

import {
  type AdminProfileAxesPageData,
  type CreateProfileAxisData,
  type ProfileAxis,
  type UpdateProfileAxisData,
} from "@repo/contracts/coaching/profile-axis";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToProfileAxis } from "../../mappers/coaching";
import { findOrThrow, handlePrismaError } from "../../utils";

const buildProfileAxisUpdateData = (
  data: UpdateProfileAxisData,
): Prisma.ProfileAxisUpdateInput => ({
  ...(data.key !== undefined && { key: data.key }),
  ...(data.label !== undefined && { label: data.label }),
  ...(data.values !== undefined && { values: data.values }),
});

export const profileAxisAdminApi = {
  getProfileAxes: async (): Promise<ProfileAxis[]> => {
    const rows = await prisma.profileAxis.findMany({ orderBy: { createdAt: "desc" } });

    return rows.map(mapToProfileAxis);
  },

  getProfileAxisById: async (id: string): Promise<ProfileAxis> => {
    const row = await findOrThrow(prisma.profileAxis.findUnique({ where: { id } }), "Profile axis");

    return mapToProfileAxis(row);
  },

  createProfileAxis: async (data: CreateProfileAxisData): Promise<ProfileAxis> => {
    try {
      const row = await prisma.profileAxis.create({
        data: { key: data.key, label: data.label, values: data.values },
      });

      return mapToProfileAxis(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Profile axis with this key already exists", { field: "key" });
      }

      return handlePrismaError(error, { entity: "Profile axis" });
    }
  },

  updateProfileAxis: async (id: string, data: UpdateProfileAxisData): Promise<ProfileAxis> => {
    await findOrThrow(prisma.profileAxis.findUnique({ where: { id } }), "Profile axis");

    try {
      const row = await prisma.profileAxis.update({
        where: { id },
        data: buildProfileAxisUpdateData(data),
      });

      return mapToProfileAxis(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Profile axis with this key already exists", { field: "key" });
      }

      return handlePrismaError(error, { entity: "Profile axis" });
    }
  },

  deleteProfileAxis: async (id: string): Promise<void> => {
    await findOrThrow(prisma.profileAxis.findUnique({ where: { id } }), "Profile axis");

    try {
      await prisma.profileAxis.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Profile axis" });
    }
  },

  getProfileAxesPageData: async (): Promise<AdminProfileAxesPageData> => {
    const profileAxes = await profileAxisAdminApi.getProfileAxes();

    return { profileAxes };
  },
};
