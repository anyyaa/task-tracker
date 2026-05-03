const LOKI_URL =
  "https://logs-prod-025.grafana.net/loki/api/v1/push";

const USER = "1579334";
const TOKEN = import.meta.env.VITE_GRAFANA_TOKEN;

export async function log(event: string, message: string, meta?: any) {
  const body = {
    streams: [
      {
        stream: {
          app: "task-tracker",
          event,
        },
        values: [
          [
            `${Date.now()}000000`,
            JSON.stringify({
              event,
              message,
              meta,
            }),
          ],
        ],
      },
    ],
  };

  try {
    await fetch(LOKI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${USER}:${TOKEN}`),
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.log("log failed", e);
  }
}
