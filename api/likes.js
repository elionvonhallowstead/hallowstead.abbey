const clientPromise = require("./mongodb");

async function readJson(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

module.exports = async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("library_reviews");
    const likes = db.collection("likes");

    if (req.method === "GET") {
      const docs = await likes.find({}).toArray();

      const state = {};

      for (const doc of docs) {
        state[doc._id] = doc.count;
      }

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");

      return res.status(200).json(state);
    }

    if (req.method === "POST") {
      const { noteId, action } = await readJson(req);

      if (
        typeof noteId !== "string" ||
        !["like", "unlike"].includes(action)
      ) {
        return res.status(400).json({
          error: "Invalid request",
        });
      }

      const increment = action === "like" ? 1 : -1;

      const existing = await likes.findOne({
        _id: noteId,
      });

      if (!existing) {
        await likes.insertOne({
          _id: noteId,
          count: increment > 0 ? 1 : 0,
        });

        return res.status(200).json({
          count: increment > 0 ? 1 : 0,
        });
      }

      const next = Math.max(0, existing.count + increment);

      await likes.updateOne(
        { _id: noteId },
        {
          $set: {
            count: next,
          },
        }
      );

      return res.status(200).json({
        count: next,
      });
    }

    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};