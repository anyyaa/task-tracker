export default async function handler(req, res) {
  console.log("LOG API HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { level, event, message, meta } = req.body;

    console.log("BODY:", req.body);

    return res.status(200).json({
      ok: true,
      received: { level, event, message, meta },
    });
  } catch (e) {
    console.log("ERROR:", e);
    return res.status(500).json({ error: "failed" });
  }
}
