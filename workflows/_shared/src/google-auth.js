import { createSign } from "node:crypto";

import { fetchJson } from "./http.js";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signJwt(payload, privateKey) {
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey);
  const encodedSignature = signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${signingInput}.${encodedSignature}`;
}

export class GoogleAuthClient {
  constructor(config) {
    this.config = config;
    this.cachedToken = null;
  }

  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    const scopes = this.config.scopes || [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ];

    if (this.cachedToken && this.cachedToken.expiresAt > now + 60) {
      return this.cachedToken.accessToken;
    }

    const payload = {
      iss: this.config.serviceAccountEmail,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    if (this.config.impersonatedUserEmail) {
      payload.sub = this.config.impersonatedUserEmail;
    }

    const assertion = signJwt(payload, this.config.privateKey);

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });

    const token = await fetchJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    this.cachedToken = {
      accessToken: token.access_token,
      expiresAt: now + Number(token.expires_in || 3600),
    };

    return this.cachedToken.accessToken;
  }
}
