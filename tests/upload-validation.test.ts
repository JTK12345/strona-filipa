import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import {
  sanitizeUploadedFileName,
  validateUpload,
} from "../app/lib/upload-validation";

function file(body: Buffer, name: string, type: string) {
  return new File([body], name, { type }) as unknown as globalThis.File;
}

function makeZip(entries: string[]) {
  const localParts: Buffer[] = [];
  const directoryParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name);

    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    directoryParts.push(directory, name);
    offset += local.length + name.length;
  }

  const directory = Buffer.concat(directoryParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, directory, end]);
}

test("accepts matching signatures, extensions, and declared content types", async () => {
  const pdf = await validateUpload(
    file(Buffer.from("%PDF-1.7\nbody\n%%EOF"), "guide.pdf", "application/pdf"),
    "attachment",
    1024,
  );
  const docx = await validateUpload(
    file(makeZip(["[Content_Types].xml", "word/document.xml"]), "guide.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "attachment",
    1024,
  );
  const mp4 = await validateUpload(
    file(Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from("ftypisom"), Buffer.alloc(4)]), "lesson.mp4", "video/mp4"),
    "video",
    1024,
  );

  assert.equal(pdf?.mimeType, "application/pdf");
  assert.equal(docx?.extension, ".docx");
  assert.equal(mp4?.extension, ".mp4");
});

test("rejects forged MIME types, wrong extensions, malformed files, and double extensions", async () => {
  const pdf = Buffer.from("%PDF-1.7\nbody\n%%EOF");
  assert.equal(await validateUpload(file(pdf, "guide.png", "image/png"), "attachment", 1024), null);
  assert.equal(await validateUpload(file(pdf, "guide.pdf", "image/png"), "attachment", 1024), null);
  assert.equal(await validateUpload(file(pdf, "guide.pdf.exe", "application/pdf"), "attachment", 1024), null);
  assert.equal(await validateUpload(file(Buffer.from("PK\x03\x04"), "guide.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "attachment", 1024), null);
});

test("removes traversal and control characters from filenames", () => {
  assert.equal(sanitizeUploadedFileName("../evil\r\n.pdf"), "evil  .pdf");
  assert.equal(sanitizeUploadedFileName("..\\folder\\guide.pdf"), "guide.pdf");
});
