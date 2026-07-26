import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  getVideoContentType,
  parseSingleRange,
  resolveVideoStoragePath,
} from "../app/lib/video-storage";

test("resolves video paths only inside the configured storage root", () => {
  const root = path.resolve("private-videos");
  const validPath = resolveVideoStoragePath(root, "course/lesson.mp4");

  assert.equal(validPath, path.resolve(root, "course/lesson.mp4"));
  assert.equal(resolveVideoStoragePath(root, "../secret.mp4"), null);
  assert.equal(resolveVideoStoragePath(root, ""), null);
});

test("allows only supported video media types", () => {
  assert.equal(getVideoContentType("lesson.mp4"), "video/mp4");
  assert.equal(getVideoContentType("lesson.WEBM"), "video/webm");
  assert.equal(getVideoContentType("lesson.pdf"), null);
});

test("parses bounded and suffix byte ranges", () => {
  assert.deepEqual(parseSingleRange("bytes=100-199", 1000), {
    start: 100,
    end: 199,
  });
  assert.deepEqual(parseSingleRange("bytes=900-", 1000), {
    start: 900,
    end: 999,
  });
  assert.deepEqual(parseSingleRange("bytes=-100", 1000), {
    start: 900,
    end: 999,
  });
});

test("rejects invalid, multiple, and out-of-bounds ranges", () => {
  assert.equal(parseSingleRange("bytes=1000-1001", 1000), null);
  assert.equal(parseSingleRange("bytes=200-100", 1000), null);
  assert.equal(parseSingleRange("bytes=0-1,3-4", 1000), null);
  assert.equal(parseSingleRange("items=0-10", 1000), null);
});
