export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.body = json;
    throw error;
  }

  return json;
}

export async function fetchBuffer(url, options = {}) {
  const response = await fetch(url, options);
  const arrayBuffer = await response.arrayBuffer();

  if (!response.ok) {
    const text = Buffer.from(arrayBuffer).toString("utf8");
    const error = new Error(`Request failed: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  return Buffer.from(arrayBuffer);
}
