const STORAGE_KEY = "hallowstead.noteLikes";

function normalizeNoteId(noteId) {
  return String(noteId || "").trim();
}

function getStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
}

function readLikeState(storage) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return {};
  }

  try {
    const raw = resolvedStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLikeState(state, storage) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return state;
  }

  resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function getLikeSummary(noteId, storage) {
  const normalizedNoteId = normalizeNoteId(noteId);
  if (!normalizedNoteId) {
    return { noteId: "", count: 0, liked: false };
  }

  const state = readLikeState(storage);
  const entry = state[normalizedNoteId] || { count: 0, liked: false };
  return {
    noteId: normalizedNoteId,
    count: Number(entry.count) || 0,
    liked: Boolean(entry.liked),
  };
}

function toggleLike(noteId, storage) {
  const normalizedNoteId = normalizeNoteId(noteId);
  const state = readLikeState(storage);
  const current = state[normalizedNoteId] || { count: 0, liked: false };
  const nextLiked = !current.liked;
  const nextCount = nextLiked
    ? (Number(current.count) || 0) + 1
    : Math.max(0, (Number(current.count) || 0) - 1);

  state[normalizedNoteId] = { count: nextCount, liked: nextLiked };
  writeLikeState(state, storage);

  return {
    noteId: normalizedNoteId,
    count: nextCount,
    liked: nextLiked,
  };
}

module.exports = {
  STORAGE_KEY,
  getLikeSummary,
  toggleLike,
  readLikeState,
  writeLikeState,
};
