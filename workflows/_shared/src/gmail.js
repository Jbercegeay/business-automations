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
    return this.sendRichMessage({ to, subject, text, from });
  }

  async sendRichMessage({ to, subject, text, html, from }) {
    const headerLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
    ];

    if (from) {
      headerLines.unshift(`From: ${from}`);
    }

    let raw;

    if (html && text) {
      const boundary = `gmail-boundary-${Date.now()}`;
      raw = [
        ...headerLines,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        text,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "",
        html,
        `--${boundary}--`,
      ].join("\r\n");
    } else if (html) {
      raw = [
        ...headerLines,
        'Content-Type: text/html; charset="UTF-8"',
        "",
        html,
      ].join("\r\n");
    } else {
      raw = [
        ...headerLines,
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        text || "",
      ].join("\r\n");
    }

    return this.request(`${GMAIL_BASE_URL}/${this.userId}/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw: base64UrlEncode(raw),
      }),
    });
  }
}
