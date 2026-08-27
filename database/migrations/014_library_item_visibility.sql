ALTER TABLE library_items
  ADD COLUMN visibility text NOT NULL DEFAULT 'all_access'
  CHECK (visibility IN ('all_access', 'selected_users'));

CREATE TABLE library_item_user_grants (
  library_item_id uuid NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (library_item_id, user_id)
);

CREATE INDEX library_item_user_grants_user_idx
  ON library_item_user_grants(user_id, library_item_id);
