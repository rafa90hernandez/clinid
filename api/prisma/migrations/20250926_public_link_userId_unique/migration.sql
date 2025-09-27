-- userId único (se ainda não aplicou)
DO $$ BEGIN
  ALTER TABLE "PublicLink" ADD CONSTRAINT "PublicLink_userId_key" UNIQUE ("userId");
EXCEPTION WHEN duplicate_table THEN
  -- ignora se já existir
END $$;

-- revokedAt opcional (se coluna não existir)
DO $$ BEGIN
  ALTER TABLE "PublicLink" ADD COLUMN "revokedAt" TIMESTAMP NULL;
EXCEPTION WHEN duplicate_column THEN
  -- ignora se já existir
END $$;
