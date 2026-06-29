-- ====================================================================
-- EdtechDocs: Row Level Security (RLS) PostgreSQL Configuration
-- ====================================================================
-- Since Prisma connects as a single database superuser/owner and does not natively 
-- pass the active app tenant/user context for every query, RLS policies are typically 
-- bypassed by Prisma queries. To strictly secure access at the PostgreSQL level:
--
-- 1. Enable RLS on the tables:
--    ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE "DocumentMember" ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE "VersionSnapshot" ENABLE ROW LEVEL SECURITY;
--
-- 2. Define the RLS access policy functions:
--
-- ====================================================================

-- Enable RLS
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VersionSnapshot" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS document_member_policy ON "Document";
DROP POLICY IF EXISTS member_self_policy ON "DocumentMember";
DROP POLICY IF EXISTS snapshot_member_policy ON "VersionSnapshot";

-- Create Policy for Document table:
-- A user can select, update, or delete a document only if they are a member of it.
-- We retrieve the current application user ID using a custom session variable 'app.current_user_id'.
CREATE POLICY document_member_policy ON "Document"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "DocumentMember" m 
      WHERE m."documentId" = "Document".id 
        AND m."userId" = current_setting('app.current_user_id', true)
    )
  );

-- Create Policy for DocumentMember table:
-- A user can only view or manage memberships of documents they belong to.
CREATE POLICY member_self_policy ON "DocumentMember"
  FOR ALL
  USING (
    "userId" = current_setting('app.current_user_id', true)
    OR EXISTS (
      SELECT 1 FROM "DocumentMember" owner_check
      WHERE owner_check."documentId" = "DocumentMember"."documentId"
        AND owner_check."userId" = current_setting('app.current_user_id', true)
        AND owner_check.role = 'OWNER'
    )
  );

-- Create Policy for VersionSnapshot table:
-- A user can read/write version snapshots only if they belong to the document.
CREATE POLICY snapshot_member_policy ON "VersionSnapshot"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "DocumentMember" m
      WHERE m."documentId" = "VersionSnapshot"."documentId"
        AND m."userId" = current_setting('app.current_user_id', true)
    )
  );
