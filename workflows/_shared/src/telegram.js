import { fetchJson } from "./http.js";

export class TelegramApprovalClient {
  constructor({ botToken, chatId }) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendApprovalRequest(receiptId, category, vendor) {
    const body = {
      chat_id: this.chatId,
      text: `Approve category "${category}" for ${vendor || "receipt"}?`,
      reply_markup: {
        inline_keyboard: [[
          { text: "Approve", callback_data: `approve:${receiptId}` },
          { text: "Reject", callback_data: `reject:${receiptId}` },
        ]],
      },
    };

    return fetchJson(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getUpdates(offset) {
    const params = new URLSearchParams({
      timeout: "0",
      allowed_updates: JSON.stringify(["callback_query"]),
    });
    if (offset) {
      params.set("offset", String(offset));
    }

    return fetchJson(`${this.baseUrl}/getUpdates?${params.toString()}`);
  }

  async answerCallbackQuery(callbackQueryId, text) {
    return fetchJson(`${this.baseUrl}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  }
}
