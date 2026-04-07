import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { contactApi } from "@repo/api-server";
import { createContactSubmissionRequestSchema } from "@repo/contracts/contact";

export const POST = withPublicRoute(async (request) => {
  const body = await request.json();
  const data = createContactSubmissionRequestSchema.parse(body);

  const submission = await contactApi.createSubmission(data);

  return NextResponse.json(submission);
});
