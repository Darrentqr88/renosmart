-- Owner phone invite support
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_phone1 TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_phone2 TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_user_id UUID;
