const STORAGE_KEY = "hallowstead.noteLikes";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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

function parseStateValue(raw) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readCookieValue(cookieValue) {
  if (typeof cookieValue === "string") {
    return cookieValue;
  }

  if (typeof globalThis === "undefined" || !globalThis.document || !globalThis.document.cookie) {
    return "";
  }

  const cookie = globalThis.document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${STORAGE_KEY}=`));

  return cookie ? cookie.slice(STORAGE_KEY.length + 1) : "";
}

function readLikeState(storage, cookieValue) {
  const resolvedStorage = getStorage(storage);
  if (resolvedStorage) {
    try {
      const raw = resolvedStorage.getItem(STORAGE_KEY);
      if (raw) {
        return parseStateValue(raw);
      }
    } catch {
      // fall through to cookie state
    }
  }

  const rawCookie = readCookieValue(cookieValue);
  return parseStateValue(rawCookie ? decodeURIComponent(rawCookie) : rawCookie);
}

function writeLikeState(state, storage) {
  const resolvedStorage = getStorage(storage);
  if (resolvedStorage) {
    try {
      resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage write failures and fall back to cookies
    }
  }

  if (typeof globalThis !== "undefined" && globalThis.document) {
    const serialized = encodeURIComponent(JSON.stringify(state));
    globalThis.document.cookie = `${STORAGE_KEY}=${serialized}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  }

  return state;
}

function mergeLikeState(baseState, incomingState) {
  const currentState = baseState && typeof baseState === "object" ? baseState : {};
  const nextState = incomingState && typeof incomingState === "object" ? incomingState : {};

  return {
    ...currentState,
    ...nextState,
  };
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
  mergeLikeState,
  toggleLike,
  readLikeState,
  writeLikeState,
};
