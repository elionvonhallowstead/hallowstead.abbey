const { list, put } = require("@vercel/blob");

async function readStateFromStorage() {
  try {
    const { blobs } = await list({
      prefix: "likes.json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobs.length) {
      return {};
    }

    blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt || 0) -
        new Date(a.uploadedAt || 0)
    );

    const response = await fetch(blobs[0].url);

    if (!response.ok) {
      return {};
    }

    const text = await response.text();

    if (!text.trim()) {
      return {};
    }

    const parsed = JSON.parse(text);

    return parsed && typeof parsed === "object"
      ? parsed
      : {};
  } catch (err) {
    console.error("Failed reading blob:", err);
    return {};
  }
}

async function writeStateToStorage(state) {
  try {
    await put(
      "likes.json",
      JSON.stringify(state, null, 2),
      {
        access: "public",
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    return true;
  } catch (err) {
    console.error("Failed writing blob:", err);
    throw err;
  }
}

module.exports = async function handler(req, res) {
  try {
    // Temporary debug endpoint
    if (req.method === "GET" && req.url.includes("debug")) {
      try {
        const result = await list({
          prefix: "likes.json",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          success: true,
          hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
          blobCount: result.blobs.length,
          blobs: result.blobs.map(b => ({
            pathname: b.pathname,
            uploadedAt: b.uploadedAt,
          })),
        }));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          success: false,
          message: err.message,
          stack: err.stack,
        }));
      }
      return;
    }

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

      req.on("data", chunk => {
        body += chunk;
      });

      req.on("end", async () => {
        try {
          const { noteId, action } = JSON.parse(body || "{}");

          if (
            typeof noteId !== "string" ||
            !["like", "unlike"].includes(action)
          ) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              error: "Invalid request",
            }));
            return;
          }

          const state = await readStateFromStorage();

          const current = Number(state[noteId]?.count) || 0;

          const next =
            action === "like"
              ? current + 1
              : Math.max(0, current - 1);

          state[noteId] = {
            count: next,
          };

          await writeStateToStorage(state);

          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
          res.end(JSON.stringify({
            count: next,
          }));
        } catch (err) {
          console.error(err);

          res.statusCode = 500;
          res.end(JSON.stringify({
            error: err.message,
          }));
        }
      });

      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({
      error: "Method not allowed",
    }));
  } catch (err) {
    console.error(err);

    res.statusCode = 500;
    res.end(JSON.stringify({
      error: err.message,
    }));
  }
};
