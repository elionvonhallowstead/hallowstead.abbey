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
          const { noteId, action } = JSON.parse(body || "{}");
    
          if (!noteId || !["like", "unlike"].includes(action)) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: "Invalid request" }));
          }
    
          const state = await readStateFromStorage();
    
          if (!state[noteId]) {
            state[noteId] = { count: 0 };
          }
    
          if (action === "like") {
            state[noteId].count++;
          } else {
            state[noteId].count = Math.max(0, state[noteId].count - 1);
          }
    
          await writeStateToStorage(state);
    
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
          res.end(JSON.stringify({
            count: state[noteId].count
          }));
    
        } catch {
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
