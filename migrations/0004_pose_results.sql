-- Additive AI Pose learning-result storage. Existing account and survey data remain unchanged.
-- No camera media, face data or raw landmark fields are stored.
CREATE TABLE pose_results (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  movement_id TEXT NOT NULL CHECK (movement_id IN ('attention', 'atEase', 'salute', 'turnLeft', 'turnRight', 'basicDrill')),
  movement_label TEXT NOT NULL,
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
  assessment TEXT NOT NULL CHECK (assessment IN ('pass', 'fail', 'incomplete')),
  required_passed INTEGER CHECK (required_passed IN (0, 1)),
  criteria_json TEXT NOT NULL,
  feedback_json TEXT NOT NULL,
  quality_json TEXT,
  step_results_json TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  processing_latency_ms REAL CHECK (processing_latency_ms >= 0),
  rubric_version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX pose_results_class ON pose_results(class_name);
CREATE INDEX pose_results_student ON pose_results(student_name);
CREATE INDEX pose_results_movement ON pose_results(movement_id);
CREATE INDEX pose_results_created ON pose_results(created_at);
CREATE INDEX pose_results_finished ON pose_results(finished_at);
CREATE INDEX pose_results_passed ON pose_results(passed);
CREATE INDEX pose_results_assessment ON pose_results(assessment);
