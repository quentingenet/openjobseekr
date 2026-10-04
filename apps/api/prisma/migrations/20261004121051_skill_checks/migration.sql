-- Skill limits enforced by the database, identical to the API's SKILL_LIMITS
-- (apps/api/src/skills/dto/skill-input.dto.ts). Keep both in sync.
ALTER TABLE "Skill"
  ADD CONSTRAINT "Skill_name_length" CHECK (char_length("name") BETWEEN 1 AND 100),
  ADD CONSTRAINT "Skill_pattern_length" CHECK (char_length("pattern") BETWEEN 1 AND 200),
  ADD CONSTRAINT "Skill_level_range" CHECK ("level" BETWEEN 0 AND 5);
