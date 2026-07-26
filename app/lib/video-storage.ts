import { isAbsolute, relative, resolve } from "node:path";

const mediaTypes = new Map([
  [".mp4", "video/mp4"],
  [".m4v", "video/x-m4v"],
  [".webm", "video/webm"],
]);

export type ByteRange = {
  start: number;
  end: number;
};

export function resolveVideoStoragePath(
  storageRootValue: string,
  storageKey: string,
) {
  const storageRoot = resolve(storageRootValue);
  const filePath = resolve(storageRoot, storageKey);
  const relativePath = relative(storageRoot, filePath);

  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath)
  ) {
    return null;
  }

  return filePath;
}

export function getVideoContentType(filePath: string) {
  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return mediaTypes.get(extension) ?? null;
}

export function parseSingleRange(value: string, size: number): ByteRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());

  if (!match || (!match[1] && !match[2]) || size <= 0) {
    return null;
  }

  if (!match[1]) {
    const suffixLength = Number(match[2]);

    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return null;
    }

    return {
      start: Math.max(size - suffixLength, 0),
      end: size - 1,
    };
  }

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}
