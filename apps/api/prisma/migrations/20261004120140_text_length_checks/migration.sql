-- Text length limits enforced by the database itself, identical to the API's TEXT_LIMITS
-- (apps/api/src/applications/dto/application-input.dto.ts). Prisma does not model CHECK
-- constraints, so they live only in this migration. Keep both in sync.

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_company_length" CHECK (char_length("company") BETWEEN 1 AND 200),
  ADD CONSTRAINT "Application_jobTitle_length" CHECK (char_length("jobTitle") BETWEEN 1 AND 200),
  ADD CONSTRAINT "Application_location_length" CHECK (char_length("location") <= 200),
  ADD CONSTRAINT "Application_response_length" CHECK (char_length("response") <= 1000),
  ADD CONSTRAINT "Application_resources_length" CHECK (char_length("resources") <= 1000),
  ADD CONSTRAINT "Application_contact_length" CHECK (char_length("contact") <= 200),
  ADD CONSTRAINT "Application_remoteRhythm_length" CHECK (char_length("remoteRhythm") <= 200),
  ADD CONSTRAINT "Application_salaryRange_length" CHECK (char_length("salaryRange") <= 200),
  ADD CONSTRAINT "Application_cvVersion_length" CHECK (char_length("cvVersion") <= 200),
  ADD CONSTRAINT "Application_stack_length" CHECK (char_length("stack") <= 1000),
  ADD CONSTRAINT "Application_recruitmentProcess_length" CHECK (char_length("recruitmentProcess") <= 10000),
  ADD CONSTRAINT "Application_notes_length" CHECK (char_length("notes") <= 10000),
  ADD CONSTRAINT "Application_jobPostingText_length" CHECK (char_length("jobPostingText") <= 50000);

-- RFC 5321 maximum email length, as validated by the API.
ALTER TABLE "User"
  ADD CONSTRAINT "User_email_length" CHECK (char_length("email") BETWEEN 3 AND 254);
