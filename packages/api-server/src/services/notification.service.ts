import { env } from "@repo/env";

interface ContactNotificationData {
  name: string | null;
  email: string | null;
  program?: string | null;
  message: string;
}

export const notificationService = {
  sendContactSubmissionNotification: async (data: ContactNotificationData): Promise<void> => {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return;
    }

    const text = `
📩 <b>New Contact Submission</b>

👤 <b>Name:</b> ${data.name || "Not provided"}
📧 <b>Email:</b> ${data.email || "Not provided"}
📋 <b>Program:</b> ${data.program || "General Question"}
📝 <b>Message:</b>
${data.message}
    `.trim();

    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API Error: ${response.statusText}`);
    }
  },
};
