import { fetchJson } from "./http.js";

const SYSTEM_PROMPT = `# Overview
You are BIG AL, an AI receipt-parsing agent. Your sole job is to transform OCR-extracted receipt text into a strict JSON object that can map into Google Sheets.

Acceptable fixed categories (case-insensitive) can have more than one:
Grocery
Restaurant
Bills
Farm and Animals
Home Improvement
Medical
Instructions

Extract and normalize these fields:
date (ISO 8601 YYYY-MM-DD)
vendor
vendor address
item name
price
subtotal
tax
total cost
Category

Prefix every monetary value with a dollar sign if one is missing.
Determine category from vendor and item list. If none fit, output a short Title-Case suggestion of 25 characters or fewer.
Output strictly valid JSON only.`;

const RECEIPT_SCHEMA = {
  name: "receipt_parser",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      date: { type: "string" },
      vendor: { type: "string" },
      "vendor address": { type: "string" },
      "item name": { type: "string" },
      price: { type: "string" },
      subtotal: { type: "string" },
      tax: { type: "string" },
      "total cost": { type: "string" },
      Category: { type: "string" },
    },
    required: [
      "date",
      "vendor",
      "vendor address",
      "item name",
      "price",
      "subtotal",
      "tax",
      "total cost",
      "Category",
    ],
  },
};

export class OpenAiReceiptParserClient {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async parseReceipt(markdown) {
    const response = await fetchJson("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        response_format: {
          type: "json_schema",
          json_schema: RECEIPT_SCHEMA,
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: markdown },
        ],
      }),
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned no message content.");
    }

    return JSON.parse(content);
  }
}
