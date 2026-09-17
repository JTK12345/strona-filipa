import assert from "node:assert/strict";
import test from "node:test";
import {
  createContentDisposition,
  sanitizeDownloadFileName,
} from "../app/lib/content-disposition";

test("Content-Disposition strips CRLF and provides an RFC 5987 filename", () => {
  const header = createContentDisposition("attachment", "report\r\nX-Injected: yes.pdf");
  assert.doesNotMatch(header, /\r|\n/);
  assert.match(header, /^attachment; filename=/);
  assert.match(header, /filename\*=UTF-8''/);
  assert.equal(sanitizeDownloadFileName("../report.pdf"), ".._report.pdf");
});
