-- Torna "userId" único na tabela "PublicLink"
-- Ajuste o nome da tabela/esquema caso diferente
ALTER TABLE "PublicLink" ADD CONSTRAINT "PublicLink_userId_key" UNIQUE ("userId");
