import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

if (!TELEGRAM_CHAT_ID) {
  throw new Error("TELEGRAM_CHAT_ID environment variable is required");
}

interface ContactFormData {
  name: string;
  email: string;
  program?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

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

    👤 Name: ${body.name}
    📧 Email: ${body.email}
    🎯 Program: ${body.program || "Not specified"}
    💬 Message: ${body.message}

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

      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
