const { list, put } = require("@vercel/blob");

const BLOB_KEY = "likes.json";

async function readStateFromBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { blobs } = await list({
      prefix: BLOB_KEY,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const latestBlob = blobs && blobs.find((blob) => blob.pathname === BLOB_KEY);
    if (!latestBlob || !latestBlob.url) {
      return null;
    }

    const response = await fetch(latestBlob.url);
    const text = await response.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeStateToBlob(state) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return false;
  }

  try {
    await put(BLOB_KEY, JSON.stringify(state, null, 2), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
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
