import { fetchJson } from "./http.js";

const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

export class MistralClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async uploadReceipt(fileName, buffer, mimeType) {
    const form = new FormData();
    form.set("purpose", "ocr");
    form.set(
      "file",
      new Blob([buffer], { type: mimeType || "application/octet-stream" }),
      fileName,
    );

    return fetchJson(`${MISTRAL_BASE_URL}/files`, {
      method: "POST",
      headers: this.headers,
      body: form,
    });
  }

  async getSignedUrl(fileId, expiryHours = 24) {
    const params = new URLSearchParams({ expiry: String(expiryHours) });
    return fetchJson(`${MISTRAL_BASE_URL}/files/${fileId}/url?${params.toString()}`, {
      headers: this.headers,
    });
  }

  async runOcr(documentUrl) {
    return fetchJson(`${MISTRAL_BASE_URL}/ocr`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          document_url: documentUrl,
        },
        include_image_base64: true,
      }),
    });
  }
}
