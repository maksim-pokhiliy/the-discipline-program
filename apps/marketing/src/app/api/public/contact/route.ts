import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { contactApi } from "@repo/api-server";
import {
  createContactSubmissionRequestSchema,
  createContactSubmissionResponseSchema,
} from "@repo/contracts/contact";

export const POST = withPublicRoute(async (request) => {
  const body = await request.json();
  const data = createContactSubmissionRequestSchema.parse(body);
  const submission = await contactApi.createSubmission(data);
  const validated = createContactSubmissionResponseSchema.parse(submission);

  return NextResponse.json(validated);
});
