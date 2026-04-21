import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { authenticate } from "@google-cloud/local-auth";
import { OAuth2Client } from "google-auth-library";

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export class GoogleOAuthClient {
  constructor({
    credentialsPath,
    tokenPath,
    scopes,
  }) {
    this.credentialsPath = credentialsPath;
    this.tokenPath = tokenPath;
    this.scopes = scopes;
    this.client = null;
  }

  createOAuthClient() {
    const credentials = readJson(this.credentialsPath);
    const config = credentials.installed || credentials.web;

    return new OAuth2Client({
      clientId: config.client_id,
      clientSecret: config.client_secret,
      redirectUri: config.redirect_uris?.[0] || "http://localhost",
    });
  }

  async authorizeInteractively() {
    const client = await authenticate({
      keyfilePath: this.credentialsPath,
      scopes: this.scopes,
    });
    this.client = client;
    this.saveToken();
    return client;
  }

  saveToken() {
    if (!this.client?.credentials) {
      return;
    }

    mkdirSync(path.dirname(this.tokenPath), { recursive: true });
    writeFileSync(this.tokenPath, JSON.stringify(this.client.credentials, null, 2));
  }

  async getAuthorizedClient() {
    if (this.client) {
      return this.client;
    }

    if (existsSync(this.tokenPath)) {
      const client = this.createOAuthClient();
      client.setCredentials(readJson(this.tokenPath));
      this.client = client;
      return client;
    }

    return this.authorizeInteractively();
  }

  async getAccessToken() {
    const client = await this.getAuthorizedClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken =
      typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

    if (!accessToken) {
      throw new Error("Google OAuth did not return an access token.");
    }

    this.saveToken();
    return accessToken;
  }
}
