const fs = require("fs");
const path = require("path");

let blobStore = null;
try {
  blobStore = require("@vercel/blob");
} catch {
  blobStore = null;
}

const DATA_FILE = path.join(process.cwd(), "likes.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), "utf8");
  }
}

function parseState(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function readStateFromBlob() {
  if (!blobStore || !process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { blobs } = await blobStore.list({
      prefix: "likes.json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobs || blobs.length === 0) {
      return null;
    }

    blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt || b.uploaded_at || 0) -
        new Date(a.uploadedAt || a.uploaded_at || 0)
    );

    const latestBlob = blobs[0];

    const response = await fetch(latestBlob.url);

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return parseState(text);
  } catch {
    return null;
  }
}

async function writeStateToBlob(state) {
  if (!blobStore) {
    console.error("@vercel/blob is not installed");
    return false;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is missing");
    return false;
  }

  try {
    await blobStore.put("likes.json", JSON.stringify(state, null, 2), {
      access: "public",
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return true;
  } catch (err) {
    console.error("Blob write failed:", err);
    return false;
  }
}

function readStateFromFile() {
  ensureDataFile();
  return parseState(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeStateToFile(state) {
  ensureDataFile();
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(state, null, 2),
    "utf8"
  );
}

async function readState() {
  const blobState = await readStateFromBlob();

  if (blobState !== null) {
    return blobState;
  }

  return readStateFromFile();
}

async function writeState(state) {
  const wroteBlob = await writeStateToBlob(state);

  if (!wroteBlob) {
    writeStateToFile(state);
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const state = await readState();

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

          const state = await readState();

          const currentCount =
            Number(state[noteId]?.count) || 0;

          const nextCount =
            action === "like"
              ? currentCount + 1
              : Math.max(0, currentCount - 1);

          state[noteId] = {
            count: nextCount,
          };

          await writeState(state);

          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              count: nextCount,
            })
          );
        } catch {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: "Invalid JSON",
            })
          );
        }
      });

      return;
    }

    res.statusCode = 405;
    res.end(
      JSON.stringify({
        error: "Method not allowed",
      })
    );
  } catch {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: "Server error",
      })
    );
  }
};
