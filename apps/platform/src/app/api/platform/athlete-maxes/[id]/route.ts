import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformAthleteMaxesApi } from "@repo/api-server";
import { deleteAthleteMaxParamsSchema } from "@repo/contracts/athlete-max";

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { id } = deleteAthleteMaxParamsSchema.parse(await context.params);

  await platformAthleteMaxesApi.delete(userId, id);

  return NextResponse.json({ success: true });
});
