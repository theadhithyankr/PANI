-- Simple fix: Make application_id nullable in interviews_v2 table
ALTER TABLE public.interviews_v2 
ALTER COLUMN application_id DROP NOT NULL;
