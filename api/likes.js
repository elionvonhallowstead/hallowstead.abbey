const fs = require("fs");
const path = require("path");

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

function readStateFromFile() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return parseState(raw);
}

function writeStateToFile(state) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const state = readStateFromFile();
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

    req.on("end", () => {
      try {
        const incoming = JSON.parse(body || "{}");
        const current = readStateFromFile();
        const nextState = {
          ...current,
          ...incoming,
        };
        writeStateToFile(nextState);
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
