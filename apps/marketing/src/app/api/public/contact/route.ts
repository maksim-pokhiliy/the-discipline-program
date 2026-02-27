import { NextResponse } from "next/server";

import { handleApiError } from "@repo/api-routes";
import { contactApi } from "@repo/api-server";
import { createContactSubmissionRequestSchema } from "@repo/contracts/contact";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createContactSubmissionRequestSchema.parse(body);

    const submission = await contactApi.createSubmission(data);

    return NextResponse.json(submission);
  } catch (error) {
    return handleApiError(error);
  }
}
