-- Align Database Schema (PostgreSQL for Render)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  firstname TEXT,
  lastname TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  personal_code TEXT UNIQUE,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS space_members (
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  PRIMARY KEY (space_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  space_id TEXT,
  private_code TEXT,
  author_id TEXT NOT NULL REFERENCES users(id),
  content TEXT,
  type TEXT DEFAULT 'text',
  media_url TEXT,
  duration REAL,
  pinned INTEGER DEFAULT 0,
  deleted_for_all INTEGER DEFAULT 0,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS private_chats (
  code TEXT PRIMARY KEY,
  user_a TEXT NOT NULL REFERENCES users(id),
  user_b TEXT NOT NULL REFERENCES users(id),
  other_name TEXT,
  other_avatar TEXT,
  pinned INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS decision_options (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decision_votes (
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES decision_options(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (decision_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_space ON messages(space_id);
CREATE INDEX IF NOT EXISTS idx_messages_private ON messages(private_code);
CREATE INDEX IF NOT EXISTS idx_space_members_user ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_personal_code ON users(personal_code);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
