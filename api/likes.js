const BLOB_URL = process.env.BLOB_URL;

async function readStateFromBlob() {
  if (!BLOB_URL) {
    return null;
  }

  try {
    const response = await fetch(BLOB_URL);
    const text = await response.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeStateToBlob(state) {
  if (!BLOB_URL) {
    return false;
  }

  try {
    await fetch(BLOB_URL, {
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
      const state = await readStateFromBlob();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.statusCode = 200;
      res.end(JSON.stringify(state || {}));
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
          const current = (await readStateFromBlob()) || {};
          const nextState = {
            ...current,
            ...incoming,
          };
          await writeStateToBlob(nextState);
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
