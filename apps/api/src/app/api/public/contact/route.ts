import { NextResponse } from "next/server";

import { contactApi } from "@repo/api-server";
import { createContactSubmissionRequestSchema } from "@repo/contracts/contact";
import { env } from "@repo/env";
import { handleApiError } from "@repo/errors";

// 1. Строгий тип ответа сервиса
type ContactSubmission = Awaited<ReturnType<typeof contactApi.createSubmission>>;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createContactSubmissionRequestSchema.parse(body);

    const submission = await contactApi.createSubmission({
      name: data.name,
      email: data.email,
      message: data.message,
    });

    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      await sendTelegramNotification(
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_CHAT_ID,
        submission,
      ).catch((err) => {
        console.error("Failed to send Telegram notification:", err);
      });
    }

    return NextResponse.json(submission);
  } catch (error) {
    return handleApiError(error);
  }
}

async function sendTelegramNotification(token: string, chatId: string, data: ContactSubmission) {
  const text = `
📩 <b>New Contact Submission</b>

👤 <b>Name:</b> ${data.name}
📧 <b>Email:</b> ${data.email}
📝 <b>Message:</b>
${data.message}
  `.trim();

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram API Error: ${response.statusText}`);
  }
}
