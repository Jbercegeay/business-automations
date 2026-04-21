export async function fetchDadJoke(services) {
  const response = await services.http.getJson("https://icanhazdadjoke.com", {
    headers: {
      Accept: "application/json",
      "User-Agent": "business-automations/dad-joke-for-joey",
    },
  });

  if (!response.joke) {
    throw new Error("Dad joke API returned no joke text");
  }

  return response.joke;
}
