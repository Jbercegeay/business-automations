import { fetchJson } from "./http.js";

const SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

export class GoogleSheetsClient {
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

  async appendRow(spreadsheetId, sheetName, row) {
    const url =
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/` +
      `${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`;

    return this.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        values: [[
          row.ID,
          row.Date,
          row.Vendor,
          row["Vendor Address"],
          row["Item Names"],
          row["Item Prices"],
          row.Quantity || "",
          row.Subtotal,
          row.Tax,
          row.Total,
          row.Category,
        ]],
      }),
    });
  }

  async updateCategoryById(spreadsheetId, sheetName, id, category) {
    const lookupUrl =
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:K`;
    const data = await this.request(lookupUrl);
    const values = data.values || [];

    for (let index = 1; index < values.length; index += 1) {
      if (values[index]?.[0] === id) {
        const rowNumber = index + 1;
        const updateUrl =
          `${SHEETS_BASE_URL}/${spreadsheetId}/values/` +
          `${encodeURIComponent(sheetName)}!K${rowNumber}?valueInputOption=USER_ENTERED`;

        return this.request(updateUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: [[category]] }),
        });
      }
    }

    throw new Error(`Could not find spreadsheet row for receipt ID ${id}`);
  }
}
