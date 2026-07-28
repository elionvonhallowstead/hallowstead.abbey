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
            })),
          },
          null,
          2
        )
      );
      return;
    }

    // Read all likes
    if (req.method === "GET") {
      const state = await readStateFromStorage();

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.statusCode = 200;
      res.end(JSON.stringify(state));
      return;
    }

    // Update likes
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
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid request" }));
            return;
          }

          const state = await readStateFromStorage();

          console.log("State before:", JSON.stringify(state));

          const current = Number(state[noteId]) || 0;

          console.log({
            noteId,
            action,
            current,
          });

          const next =
            action === "like"
              ? current + 1
              : Math.max(0, current - 1);

          state[noteId] = next;

          console.log("State after:", JSON.stringify(state));

          await writeStateToStorage(state);

          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
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