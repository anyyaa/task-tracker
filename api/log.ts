export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { level, event, message, meta } = req.body;

  const LOKI_URL = process.env.LOKI_URL;
  const USER = process.env.LOKI_USER;
  const PASS = process.env.LOKI_PASS;

  const logEntry = {
    event,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(LOKI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":
          "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64"),
      },
      body: JSON.stringify({
        streams: [
          {
            stream: {
              app: "task-tracker",
              level,
              event,
            },
            values: [[`${Date.now()}000000`, JSON.stringify(logEntry)]],
          },
        ],
      }),
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "log failed" });
  }
}
