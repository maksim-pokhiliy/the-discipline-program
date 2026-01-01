import { createContactSubmissionRequestSchema } from "@repo/contracts/contact";
import { handleApiError, InternalServerError } from "@repo/errors";
import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new InternalServerError("TELEGRAM_BOT_TOKEN environment variable is required");
    }

    if (!TELEGRAM_CHAT_ID) {
      throw new InternalServerError("TELEGRAM_CHAT_ID environment variable is required");
    }

    const body = await request.json();
    const data = createContactSubmissionRequestSchema.parse(body);

    const currentTime = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Kiev",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const telegramMessage = `
🔥 New Contact Form Submission

👤 Name: ${data.name}
📧 Email: ${data.email}
🎯 Program: ${data.program || "Not specified"}
💬 Message: ${data.message}

⏰ ${currentTime}`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: "HTML",
        }),
      },
    );

    if (!telegramResponse.ok) {
      const telegramError = await telegramResponse.text();

      console.error("Telegram API error:", telegramError);
      throw new InternalServerError("Failed to send notification");
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
