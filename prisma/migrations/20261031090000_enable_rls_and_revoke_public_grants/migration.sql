-- Migration: 20261031090000_enable_rls_and_revoke_public_grants
-- Purpose: Enable Row Level Security (RLS) on all public tables and revoke PostgREST public grants.
-- Rationale: Nav Brahmi uses pure server-side Prisma connected via direct/pooler PostgreSQL URL (as postgres role).
-- The PostgREST Data API (/rest/v1) is not used. Default Supabase grants to anon and authenticated
-- expose public tables to unrestricted access unless RLS is enabled and grants are revoked.

-- 1. Enable Row Level Security on all application and migration tables
ALTER TABLE IF EXISTS "Activation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "EmailOutbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "License" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "RecoveryToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "RefundRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all privileges from PostgREST anon and authenticated roles if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM authenticated;
  END IF;
END $$;
