ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS video_storage_key text,
  ADD COLUMN IF NOT EXISTS video_file_name text,
  ADD COLUMN IF NOT EXISTS video_mime_type text,
  ADD COLUMN IF NOT EXISTS video_file_size_bytes bigint CHECK (
    video_file_size_bytes IS NULL OR video_file_size_bytes >= 0
  ),
  ADD COLUMN IF NOT EXISTS attachment_storage_key text,
  ADD COLUMN IF NOT EXISTS attachment_file_name text,
  ADD COLUMN IF NOT EXISTS attachment_mime_type text,
  ADD COLUMN IF NOT EXISTS attachment_file_size_bytes bigint CHECK (
    attachment_file_size_bytes IS NULL OR attachment_file_size_bytes >= 0
  );

UPDATE library_items
SET
  video_storage_key = storage_key,
  video_file_name = file_name,
  video_mime_type = mime_type,
  video_file_size_bytes = file_size_bytes
WHERE storage_key IS NOT NULL
  AND (mime_type LIKE 'video/%' OR item_type = 'video')
  AND video_storage_key IS NULL;

UPDATE library_items
SET
  attachment_storage_key = storage_key,
  attachment_file_name = file_name,
  attachment_mime_type = mime_type,
  attachment_file_size_bytes = file_size_bytes
WHERE storage_key IS NOT NULL
  AND NOT (mime_type LIKE 'video/%' OR item_type = 'video')
  AND attachment_storage_key IS NULL;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS attachment_storage_key text,
  ADD COLUMN IF NOT EXISTS attachment_file_name text,
  ADD COLUMN IF NOT EXISTS attachment_mime_type text,
  ADD COLUMN IF NOT EXISTS attachment_file_size_bytes bigint CHECK (
    attachment_file_size_bytes IS NULL OR attachment_file_size_bytes >= 0
  );
