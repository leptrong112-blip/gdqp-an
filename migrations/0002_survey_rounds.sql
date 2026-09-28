-- Additive migration: all historical responses remain untouched.
CREATE TABLE survey_rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);
INSERT INTO survey_rounds (id, name, notes, createdAt)
SELECT 'legacy', 'Đợt 1 — dữ liệu hiện có', 'Giữ nguyên toàn bộ khảo sát trước khi có quản lý đợt.',
  COALESCE(MIN(createdAt), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) FROM survey_responses;
ALTER TABLE survey_config ADD COLUMN active_round_id TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE survey_responses ADD COLUMN roundId TEXT NOT NULL DEFAULT 'legacy';
CREATE INDEX survey_responses_round ON survey_responses(roundId, role, phase);
CREATE TABLE round_feedback_analysis (
  scope TEXT PRIMARY KEY,
  signature TEXT NOT NULL,
  analysis_json TEXT NOT NULL
);
