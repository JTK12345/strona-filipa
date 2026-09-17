export type UploadKind = "video" | "attachment";

export type ValidatedUpload = {
  buffer: Buffer;
  extension: string;
  mimeType: string;
  safeFileName: string;
};

type FileFormat = {
  extension: string;
  mimeType: string;
  kind: UploadKind;
  matches: (buffer: Buffer) => boolean;
};

const fileFormats: readonly FileFormat[] = [
  {
    extension: ".mp4",
    mimeType: "video/mp4",
    kind: "video",
    matches: (buffer) =>
      buffer.length >= 12 && buffer.subarray(4, 8).equals(Buffer.from("ftyp")),
  },
  {
    extension: ".webm",
    mimeType: "video/webm",
    kind: "video",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
      buffer.subarray(0, Math.min(buffer.length, 4096)).includes(Buffer.from("webm")),
  },
  {
    extension: ".pdf",
    mimeType: "application/pdf",
    kind: "attachment",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 5).equals(Buffer.from("%PDF-")) &&
      buffer.subarray(Math.max(0, buffer.length - 2048)).includes(Buffer.from("%%EOF")),
  },
  {
    extension: ".png",
    mimeType: "image/png",
    kind: "attachment",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    extension: ".jpg",
    mimeType: "image/jpeg",
    kind: "attachment",
    matches: (buffer) =>
      buffer.length >= 4 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff &&
      buffer.subarray(Math.max(0, buffer.length - 2048)).includes(Buffer.from([0xff, 0xd9])),
  },
  {
    extension: ".jpeg",
    mimeType: "image/jpeg",
    kind: "attachment",
    matches: (buffer) =>
      buffer.length >= 4 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff &&
      buffer.subarray(Math.max(0, buffer.length - 2048)).includes(Buffer.from([0xff, 0xd9])),
  },
  {
    extension: ".docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    kind: "attachment",
    matches: isOfficeDocx,
  },
];

function isOfficeDocx(buffer: Buffer) {
  // A DOCX is a ZIP package. Inspect the central directory rather than merely
  // accepting a ZIP signature, which prevents arbitrary ZIP uploads.
  const endOfCentralDirectory = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const centralDirectory = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  const localFileHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const eocdIndex = buffer.lastIndexOf(endOfCentralDirectory);

  if (eocdIndex < 0 || eocdIndex + 22 > buffer.length) {
    return false;
  }

  const entryCount = buffer.readUInt16LE(eocdIndex + 10);
  const directorySize = buffer.readUInt32LE(eocdIndex + 12);
  const directoryOffset = buffer.readUInt32LE(eocdIndex + 16);

  if (
    entryCount === 0 ||
    directoryOffset + directorySize > buffer.length ||
    directoryOffset + 46 > buffer.length
  ) {
    return false;
  }

  const entries = new Set<string>();
  let offset = directoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (!buffer.subarray(offset, offset + 4).equals(centralDirectory) || offset + 46 > buffer.length) {
      return false;
    }

    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength;

    if (
      nextOffset > buffer.length ||
      localHeaderOffset + 30 > buffer.length ||
      !buffer.subarray(localHeaderOffset, localHeaderOffset + 4).equals(localFileHeader)
    ) {
      return false;
    }

    entries.add(buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8"));
    offset = nextOffset;
  }

  return entries.has("[Content_Types].xml") && entries.has("word/document.xml");
}

function extensionFor(fileName: string) {
  const match = /\.([a-z0-9]{1,8})$/i.exec(fileName.trim());
  return match ? `.${match[1].toLowerCase()}` : "";
}

export function sanitizeUploadedFileName(fileName: string) {
  const normalized = fileName.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ");
  const leafName = normalized.split(/[\\/]/).pop()?.trim() ?? "";
  return leafName.slice(0, 180) || "upload";
}

export async function validateUpload(
  upload: File,
  kind: UploadKind,
  maximumSize: number,
): Promise<ValidatedUpload | null> {
  if (!upload.name || upload.size <= 0 || upload.size > maximumSize) {
    return null;
  }

  const safeFileName = sanitizeUploadedFileName(upload.name);
  const extension = extensionFor(safeFileName);
  const format = fileFormats.find((candidate) => candidate.extension === extension && candidate.kind === kind);

  if (!format || upload.type !== format.mimeType) {
    return null;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await upload.arrayBuffer());
  } catch {
    return null;
  }

  if (buffer.length !== upload.size || !format.matches(buffer)) {
    return null;
  }

  return {
    buffer,
    extension: format.extension,
    mimeType: format.mimeType,
    safeFileName,
  };
}
