const STORAGE_URL = process.env.STORAGE_URL;

async function readStateFromStorage() {
  if (!STORAGE_URL) {
    return {};
  }

  try {
    const response = await fetch(STORAGE_URL);

    if (!response.ok) {
      return {};
    }

    const text = await response.text();

    if (!text.trim()) {
      return {};
    }

    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
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
      headers: {
        "Content-Type": "application/json",
      },
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

          if (
            typeof noteId !== "string" ||
            !["like", "unlike"].includes(action)
          ) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid request" }));
            return;
          }

          const state = await readStateFromStorage();

          const currentCount = Number(state[noteId]?.count) || 0;

          let nextCount = currentCount;

          if (action === "like") {
            nextCount++;
          } else {
            nextCount = Math.max(0, currentCount - 1);
          }

          state[noteId] = {
            count: nextCount,
          };

          const saved = await writeStateToStorage(state);

          if (!saved) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to save likes" }));
            return;
          }

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
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });

      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server error" }));
  }
};
