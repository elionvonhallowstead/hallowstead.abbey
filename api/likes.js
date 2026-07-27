const STORAGE_URL = process.env.STORAGE_URL;

async function readStateFromStorage() {
  if (!STORAGE_URL) {
    return {};
  }

  try {
    const response = await fetch(STORAGE_URL);
    const text = await response.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function writeStateToStorage(state) {
  if (!STORAGE_URL) {
    return false;
  }

  try {
    await fetch(STORAGE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state, null, 2),
    });
    return true;
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const state = await readStateFromStorage();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.statusCode = 200;
      res.end(JSON.stringify(state));
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        try {
          const incoming = JSON.parse(body || "{}");
          const current = await readStateFromStorage();
          const nextState = {
            ...current,
            ...incoming,
          };
          await writeStateToStorage(nextState);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
          res.end(JSON.stringify(nextState));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server error" }));
  }
};
