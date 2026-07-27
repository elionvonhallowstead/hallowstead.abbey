const { list, put } = require("@vercel/blob");

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function getUrl(req) {
  return new URL(req.url, `https://${req.headers.host || "localhost"}`);
}

async function getLatestBlob() {
  if (!TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing");
  }

  const { blobs } = await list({
    prefix: "likes.json",
    token: TOKEN,
  });

  if (!blobs.length) {
    return null;
  }

  blobs.sort(
    (a, b) =>
      new Date(b.uploadedAt || 0) -
      new Date(a.uploadedAt || 0)
  );

  return blobs[0];
}

async function readStateFromStorage() {
  const latest = await getLatestBlob();

  if (!latest) {
    return {};
  }

  const response = await fetch(latest.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed reading blob (${response.status})`
    );
  }

  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  return JSON.parse(text);
}

async function writeStateToStorage(state) {
  if (!TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing");
  }

  await put(
    "likes.json",
    JSON.stringify(state, null, 2),
    {
      access: "public",
      allowOverwrite: true,
      token: TOKEN,
      addRandomSuffix: false,
    }
  );
}

module.exports = async function handler(req, res) {
  try {
    const url = getUrl(req);

    if (req.method === "GET" && url.searchParams.has("debug")) {
      const { blobs } = await list({
        token: TOKEN,
      });

      res.setHeader("Content-Type", "application/json");

      res.end(
        JSON.stringify(
          {
            success: true,
            node: process.version,
            hasToken: !!TOKEN,
            blobCount: blobs.length,
            blobs: blobs.map((b) => ({
              pathname: b.pathname,
              uploadedAt: b.uploadedAt,
              size: b.size,
              url: b.url,
            })),
          },
          null,
          2
        )
      );

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

      req.on("data", (chunk) => {
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
            res.end(
              JSON.stringify({
                error: "Invalid request",
              })
            );
            return;
          }

          const state = await readStateFromStorage();

          const current = Number(state[noteId]) || 0;

          const next =
            action === "like"
              ? current + 1
              : Math.max(0, current - 1);

          state[noteId] = next;

          await writeStateToStorage(state);

          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");

          res.statusCode = 200;
          res.end(JSON.stringify(next));
        } catch (err) {
          console.error(err);

          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");

          res.end(
            JSON.stringify({
              success: false,
              name: err.name,
              message: err.message,
              stack: err.stack,
            })
          );
        }
      });

      return;
    }

    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");

    res.end(
      JSON.stringify({
        error: "Method not allowed",
      })
    );
  } catch (err) {
    console.error(err);

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");

    res.end(
      JSON.stringify({
        success: false,
        name: err.name,
        message: err.message,
        stack: err.stack,
      })
    );
  }
};