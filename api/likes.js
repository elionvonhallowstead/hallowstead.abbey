const { list, put } = require("@vercel/blob");

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function getUrl(req) {
  return new URL(req.url, `https://${req.headers.host || "localhost"}`);
}

async function readStateFromStorage() {
  if (!TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing");
  }

  const { blobs } = await list({
    prefix: "likes.json",
    token: TOKEN,
  });

  if (!blobs.length) {
    return {};
  }

  blobs.sort(
    (a, b) =>
      new Date(b.uploadedAt || 0) -
      new Date(a.uploadedAt || 0)
  );

  const response = await fetch(blobs[0].url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed reading blob (${response.status})`);
  }

  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  return JSON.parse(text);
}

async function writeStateToStorage(state) {
  throw new Error("WRITE FUNCTION REACHED");
}/*
  if (!TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing");
  }

  console.log("Uploading:", JSON.stringify(state));

  const result = await put(
    "likes.json",
    JSON.stringify(state, null, 2),
    {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      token: TOKEN,
    }
  );

  const verify = await fetch(result.url, {
    cache: "no-store",
  });

  const uploaded = await verify.text();

  console.log("Blob now contains:");
  console.log(uploaded);

  return true;
}*/

module.exports = async function handler(req, res) {
  try {
    const url = getUrl(req);

    // Debug endpoint
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
              downloadUrl: b.downloadUrl,
              access: b.access,
            })),
          },
          null,
          2
        )
      );
      return;
    }

    // GET
    if (req.method === "GET") {
      const state = await readStateFromStorage();

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(state));
      return;
    }

    // POST
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
            res.end(JSON.stringify({ error: "Invalid request" }));
            return;
          }

          const state = await readStateFromStorage();

          const current = Number(state[noteId]) || 0;

          const next =
            action === "like"
              ? current + 1
              : Math.max(0, current - 1);

          state[noteId] = next;

          console.log("State about to upload:", JSON.stringify(state));

          await writeStateToStorage(state);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify({ count: next }));
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
    res.end(JSON.stringify({ error: "Method not allowed" }));
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