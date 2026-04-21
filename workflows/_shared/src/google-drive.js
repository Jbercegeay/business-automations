import { fetchBuffer, fetchJson } from "./http.js";

const DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

export class GoogleDriveClient {
  constructor(authClient) {
    this.authClient = authClient;
  }

  async request(url, options = {}) {
    const token = await this.authClient.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return fetchJson(url, { ...options, headers });
  }

  async requestBuffer(url, options = {}) {
    const token = await this.authClient.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return fetchBuffer(url, { ...options, headers });
  }

  async getAccessToken() {
    return this.authClient.getAccessToken();
  }

  async listFilesInFolder(folderId) {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent(
      "files(id,name,mimeType,createdTime,parents,webViewLink)",
    );
    const url = `${DRIVE_BASE_URL}?q=${query}&orderBy=createdTime asc&fields=${fields}`;
    const result = await this.request(url);
    return result.files || [];
  }

  async downloadFile(fileId) {
    const url = `${DRIVE_BASE_URL}/${fileId}?alt=media`;
    return this.requestBuffer(url);
  }

  async moveFile(fileId, addParents, removeParents) {
    const params = new URLSearchParams({
      addParents,
      removeParents,
      fields: "id,name,parents",
    });
    const url = `${DRIVE_BASE_URL}/${fileId}?${params.toString()}`;
    return this.request(url, { method: "PATCH" });
  }

  async renameFile(fileId, name) {
    const url = `${DRIVE_BASE_URL}/${fileId}?fields=id,name`;
    return this.request(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }

  async uploadFile({ name, folderId, mimeType, buffer }) {
    const token = await this.getAccessToken();
    const boundary = `drive-upload-${Date.now()}`;
    const metadata = {
      name,
      parents: folderId ? [folderId] : undefined,
    };

    const preamble =
      `--${boundary}\r\n` +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`;
    const closing = `\r\n--${boundary}--`;
    const body = Buffer.concat([
      Buffer.from(preamble, "utf8"),
      buffer,
      Buffer.from(closing, "utf8"),
    ]);

    return fetchJson(
      `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,mimeType,parents,webViewLink,webContentLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );
  }
}
