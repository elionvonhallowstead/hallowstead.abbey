import { describe, expect, it } from "vitest";
import likeUtils from "./likeUtils.js";

function makeStorage(initialState = {}) {
  const store = { ...initialState };

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

describe("likeUtils", () => {
  it("starts a new note at zero likes", () => {
    const storage = makeStorage();

    expect(likeUtils.getLikeSummary("book-1", storage)).toEqual({
      noteId: "book-1",
      count: 0,
      liked: false,
    });
  });

  it("toggles like state and persists the change", () => {
    const storage = makeStorage();

    expect(likeUtils.toggleLike("book-1", storage)).toEqual({
      noteId: "book-1",
      count: 1,
      liked: true,
    });

    expect(likeUtils.toggleLike("book-1", storage)).toEqual({
      noteId: "book-1",
      count: 0,
      liked: false,
    });
  });

  it("reads a cookie-backed state when storage is empty", () => {
    const storage = makeStorage();
    const cookieValue = encodeURIComponent(JSON.stringify({
      "book-1": { count: 2, liked: true },
    }));

    expect(likeUtils.readLikeState(storage, cookieValue)).toEqual({
      "book-1": { count: 2, liked: true },
    });
  });
});
