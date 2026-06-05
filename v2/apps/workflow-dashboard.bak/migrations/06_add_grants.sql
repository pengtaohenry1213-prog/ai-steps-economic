-- Grant explicit permissions for Data API access (Supabase 2026+)
-- This migration ensures tables in public schema are accessible via Data API
-- Reference: https://supabase.com/docs/guides/database/postgres/data-api-updates

-- Schema usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- proposals table permissions
GRANT SELECT ON public.proposals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO service_role;

-- proposal_versions table permissions
GRANT SELECT ON public.proposal_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_versions TO service_role;

-- lifecycle_snapshots table permissions
GRANT SELECT ON public.lifecycle_snapshots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifecycle_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifecycle_snapshots TO service_role;
