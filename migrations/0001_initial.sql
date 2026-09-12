CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  salt TEXT NOT NULL,
  hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS survey_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_open INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO survey_config (id, is_open) VALUES (1, 1);

CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  username TEXT,
  name TEXT,
  school TEXT,
  className TEXT,
  position TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  phase TEXT NOT NULL CHECK (phase IN ('before', 'after')),
  createdAt TEXT NOT NULL,
  answers TEXT NOT NULL,
  feedback TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_responses_created ON survey_responses(createdAt);
CREATE INDEX IF NOT EXISTS idx_responses_account_phase ON survey_responses(code, role, phase);

CREATE TABLE IF NOT EXISTS feedback_analysis (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  signature TEXT NOT NULL,
  analysis_json TEXT NOT NULL
);

INSERT OR IGNORE INTO accounts (id, username, name, role, salt, hash) VALUES
('1D6C7C4E6A07400581CB54D764D7F7A4', 'admin', 'Quản trị viên', 'admin', '063ebd41acd969e6627c7cdcbd4437ad', 'ef074fc4ef66bce001f7fefbb6dca5431758bc347ffe6cf1f4cf7985d3ab220201a2577abb8cc36119b34227137cae39c1a9e158b6985e4ce91d69c6d80afed2');
