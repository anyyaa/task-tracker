export const log = async (
  level: "info" | "error",
  event: string,
  message: string,
  meta: any = {}
) => {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ level, event, message, meta }),
    });
  } catch (e) {
    console.error("log failed");
  }
};
