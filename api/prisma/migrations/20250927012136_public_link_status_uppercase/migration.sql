-- 1) Criar novo enum com valores UPPERCASE
CREATE TYPE "PublicLinkStatus_new" AS ENUM ('ACTIVE', 'REVOKED');

-- 2) Alterar a coluna para usar o novo enum convertendo os valores existentes
ALTER TABLE "PublicLink"
  ALTER COLUMN "status" TYPE "PublicLinkStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'active' THEN 'ACTIVE'::"PublicLinkStatus_new"
      WHEN "status"::text = 'revoked' THEN 'REVOKED'::"PublicLinkStatus_new"
      ELSE 'ACTIVE'::"PublicLinkStatus_new"
    END
  );

-- (Opcional) Default para ACTIVE, se você usa default
ALTER TABLE "PublicLink"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"PublicLinkStatus_new";

-- 3) Remover o enum antigo e renomear o novo para o nome original
DROP TYPE "PublicLinkStatus";
ALTER TYPE "PublicLinkStatus_new" RENAME TO "PublicLinkStatus";
