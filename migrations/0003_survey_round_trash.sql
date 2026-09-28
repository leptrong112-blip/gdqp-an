-- Recoverable deletion only: retain all survey responses and cached analyses.
ALTER TABLE survey_rounds ADD COLUMN deletedAt TEXT;
