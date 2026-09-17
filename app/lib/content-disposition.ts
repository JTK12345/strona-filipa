export function sanitizeDownloadFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKC")
    .replace(/[\r\n\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\/]/g, "_")
    .replace(/["\\]/g, "_")
    .trim()
    .slice(0, 180);

  return cleaned || "download";
}

function encodeRfc5987(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function createContentDisposition(
  disposition: "inline" | "attachment",
  fileName?: string | null,
) {
  if (!fileName) {
    return disposition;
  }

  const safeName = sanitizeDownloadFileName(fileName);
  const asciiFallback = safeName.replace(/[^\x20-\x7e]/g, "_");
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeRfc5987(safeName)}`;
}
