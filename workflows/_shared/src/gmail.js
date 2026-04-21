import { fetchJson } from "./http.js";

const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export class GmailClient {
  constructor(authClient, userId = "me") {
    this.authClient = authClient;
    this.userId = userId;
  }

  async request(url, options = {}) {
    const token = await this.authClient.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return fetchJson(url, { ...options, headers });
  }

  async sendMessage({ to, subject, text, from }) {
    const lines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
    ];

    if (from) {
      lines.unshift(`From: ${from}`);
    }

    const raw = `${lines.join("\r\n")}\r\n\r\n${text}`;

    return this.request(`${GMAIL_BASE_URL}/${this.userId}/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw: base64UrlEncode(raw),
      }),
    });
  }
}
