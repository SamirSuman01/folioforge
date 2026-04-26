-- Add ATS match score to application pipeline rows
-- Populated when user runs ATS Autopsy and links it to a pipeline application

alter table applications
  add column if not exists ats_score integer check (ats_score between 0 and 100);
