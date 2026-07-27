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
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readStateFromBlob() {
  if (!blobStore || !process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { blobs } = await blobStore.list({ prefix: "likes.json", token: process.env.BLOB_READ_WRITE_TOKEN });
    const latestBlob = blobs && blobs[0];
    if (!latestBlob || !latestBlob.url) {
      return null;
    }

    const response = await fetch(latestBlob.url);
    const text = await response.text();
    return parseState(text);
  } catch {
    return null;
  }
}

async function writeStateToBlob(state) {
  if (!blobStore || !process.env.BLOB_READ_WRITE_TOKEN) {
    return false;
  }

  try {
    await blobStore.put("likes.json", JSON.stringify(state, null, 2), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return true;
  } catch {
    return false;
  }
}

function readStateFromFile() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return parseState(raw);
}

function writeStateToFile(state) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

async function readState() {
  const blobState = await readStateFromBlob();
  if (blobState) {
    return blobState;
  }

  return readStateFromFile();
}

async function writeState(state) {
  const wroteBlob = await writeStateToBlob(state);
  if (wroteBlob) {
    return;
  }

  writeStateToFile(state);
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const state = await readState();
    res.setHeader("Content-Type", "application/json");
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
        const current = await readState();
        const nextState = {
          ...current,
          ...incoming,
        };
        await writeState(nextState);
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(nextState));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
};
