# ClinID

> **Sistema de Identificação Clínica com acesso público via QR + PIN**

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Stack](https://img.shields.io/badge/stack-Next.js_15%20%7C%20NestJS%20%7C%20Prisma%20%7C%20PostgreSQL%20%7C%20Docker%20%7C%20Nginx-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

ClinID é um sistema web que permite cadastrar perfis clínicos e expor **informações essenciais** em situações de emergência via **QR Code** protegido por **PIN de 6 dígitos (hash)**. O app separa credenciais privadas (login) das credenciais públicas (PIN), mantendo um fluxo simples para o usuário e seguro para os dados.

---

## ✨ Sumário

* [Visão Geral](#-visão-geral)
* [Principais Funcionalidades](#-principais-funcionalidades)
* [Arquitetura & Domínio](#-arquitetura--domínio)
* [Tecnologias](#-tecnologias)
* [Estrutura do Repositório](#-estrutura-do-repositório)
* [Variáveis de Ambiente](#-variáveis-de-ambiente)
* [Como Rodar](#-como-rodar)

  * [Local (sem Docker)](#local-sem-docker)
  * [Docker (Desenvolvimento)](#docker-desenvolvimento)
  * [Docker (Produção)](#docker-produção)
* [URLs Importantes](#-urls-importantes)
* [Coleção Postman](#-coleção-postman)
* [Banco de Dados (Prisma)](#-banco-de-dados-prisma)
* [E-mail (Nodemailer/Gmail)](#-e-mail-nodemailergmail)
* [Troubleshooting](#-troubleshooting)
* [Checklist de Entrega](#-checklist-de-entrega)
* [Licença](#-licença)

---

## 🔎 Visão Geral

Na Fase 2, o ClinID evoluiu de protótipo para sistema funcional **Next.js (web)** + **NestJS (API)** com **Prisma/PostgreSQL** e **Docker + Nginx**. Foram implementados os fluxos críticos (login/registro, cadastro clínico, histórico, QR/print, reset/forgot de senha com e-mail) e modelado o domínio com foco em segurança e simplicidade.

---

## ✅ Principais Funcionalidades

* **Autenticação** (login/registro) separada de **PIN** público (hash) para acesso emergencial.
* **Cadastro Clínico** (ClinicalProfile) e **Histórico** (read-only) para consulta rápida.
* **QR Code** para acesso público imediato a informações essenciais.
* **Impressão do QR** (tela dedicada) para cartões/adesivos.
* **Esqueci/Resetar Senha** com envio de e-mail via **Nodemailer/Gmail**.
* **AuditLog** básico para rastreabilidade.

---

## 🧩 Arquitetura & Domínio

**Entidades (Prisma/PostgreSQL):** `User`, `ClinicalProfile`, `PublicCredential` (PIN com hash), `PublicLink` (código público), `ClinicalHistory`, `PasswordResetToken`, `AuditLog`.

**Fluxo público:** QR → rota `/public/:code` → validação de PIN → exibe dados essenciais (sem dados sensíveis).

**Fluxo privado:** autenticação JWT → CRUD de perfil clínico e geração/renovação de link público.

---

## 🛠 Tecnologias

* **Web:** Next.js 15 (App Router)
* **API:** NestJS
* **ORM:** Prisma
* **DB:** PostgreSQL
* **Infra:** Docker, Docker Compose, Nginx (prod)
* **E-mail:** Nodemailer (Gmail)

---

## 🗂 Estrutura do Repositório

```
clinid/
├─ api/                  # NestJS (Auth, ClinicalProfile, Public, Reset, Audit)
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  └─ src/
├─ web/                  # Next.js (login, register, clinical-register, history, qr/print, forgot, reset)
├─ nginx/                # confs de produção (reverse proxy)
├─ docs/                 # Postman, UML, amostras de QR, etc.
├─ docker-compose.dev.yml
└─ docker-compose.prod.yml
```

**Caminhos no Windows / Git Bash**

* Windows (VSCode):

  * `C:\Users\rafae\clinid\docker-compose.dev.yml`
  * `C:\Users\rafae\clinid\docker-compose.prod.yml`
* Git Bash:

  * `/c/Users/rafae/clinid/docker-compose.dev.yml`
  * `/c/Users/rafae/clinid/docker-compose.prod.yml`

---

## 🔐 Variáveis de Ambiente

### API (`api/.env`)

```bash
# Banco
DATABASE_URL="postgresql://postgres:postgres@db:5432/clinid?schema=public"

# Auth
JWT_SECRET="trocar_por_um_segredo_forte"
JWT_EXPIRES_IN="15m"
REFRESH_EXPIRES_IN="7d"

# E-mail (Nodemailer/Gmail)
MAIL_FROM_NAME="ClinID"
MAIL_FROM_ADDRESS="cliniddev@gmail.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="cliniddev@gmail.com"
SMTP_PASS="APP_PASSWORD_DO_GMAIL"  # senha de app

# App
APP_PORT=3001
NODE_ENV=development
```

### Web (`web/.env.local` / `.env.production`)

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"     # prod: https://clinid.onrender.com
NEXT_PUBLIC_PUBLIC_SITE_URL="http://localhost:3000"  # prod: https://clinid-frontend.onrender.com
```

> Em produção (Render), as URLs oficiais são `https://clinid.onrender.com` (API) e `https://clinid-frontend.onrender.com` (Web), servidas atrás do **Nginx**.

---

## ▶️ Como Rodar

### Local (sem Docker)

**API**

```bash
cd api
npm ci
npx prisma generate
npx prisma migrate dev   # ou migrate deploy conforme o caso
npm run start:dev        # porta 3001
```

**Web**

```bash
cd web
npm ci
npm run dev              # porta 3000
```

### Docker (Desenvolvimento)

**Subir tudo (build + up)**

```bash
# Git Bash
docker compose -f /c/Users/rafae/clinid/docker-compose.dev.yml up -d --build

# PowerShell/VSCode (equivalente)
docker compose -f C:\Users\rafae\clinid\docker-compose.dev.yml up -d --build
```

**Migrar banco (dentro da API)**

```bash
docker exec -it clinid_api sh -lc "npx prisma migrate deploy && npx prisma generate"
```

**Rebuild rápido**

```bash
# Web
docker compose -f C:\Users\rafae\clinid\docker-compose.dev.yml up -d --build web
# API
docker compose -f C:\Users\rafae\clinid\docker-compose.dev.yml up -d --build api
```

**Logs**

```bash
docker compose -f C:\Users\rafae\clinid\docker-compose.dev.yml logs -f api
docker compose -f C:\Users\rafae\clinid\docker-compose.dev.yml logs -f web
```

### Docker (Produção)

```bash
docker compose -f C:\Users\rafae\clinid\docker-compose.prod.yml up -d --build
# Migrations
docker exec -it clinid_api sh -lc "npx prisma migrate deploy && npx prisma generate"
```

**Portas padrão**

* Web: `3000` (dev) → Prod via Nginx `:80/:443`
* API: `3001`
* DB: `5432`
* Prisma Studio: `5555`

---

## 🔗 URLs Importantes

**Front-end**

* Home / Login: `http://localhost:3000/`
* Registro: `http://localhost:3000/register`
* Cadastro Clínico: `http://localhost:3000/clinical-register`
* Histórico (read-only): `http://localhost:3000/history`
* Esqueci a senha: `http://localhost:3000/forgot`
* Reset de senha: `http://localhost:3000/reset?token=<TOKEN>`
* QR (visualizar): `http://localhost:3000/qr`
* QR (imprimir): `http://localhost:3000/qr/print`

**API** (base local: `http://localhost:3001`)

* Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
* Password: `POST /password/forgot`, `POST /password/reset`
* ClinicalProfile: `GET /clinical-profiles/me`, `POST /clinical-profiles`, `PUT /clinical-profiles/:id`
* Público/QR: `POST /public-link`, `GET /public/:code?pin=123456`
* Saúde: `GET /health` (se habilitado)

---

## 🧪 Coleção Postman

* Coleção: `docs/ClinID.postman_collection.json`
* Ambiente Local: `docs/ClinID.postman_environment.json`

  * `base_url = http://localhost:3001`
  * Variáveis úteis: `email`, `password`, `access_token` (set via script pós-login), `public_code`, `pin`.

**Fluxo sugerido de teste**

1. `POST /auth/register`
2. `POST /auth/login` → salvar `access_token`
3. `GET /auth/me`
4. `POST /clinical-profiles`
5. `POST /public-link` → obter `code`
6. `GET /public/:code?pin=******`
7. `POST /password/forgot`
8. `POST /password/reset`

---

## 🗄 Banco de Dados (Prisma)

```bash
cd api
npx prisma generate
npx prisma migrate dev      # local
# ou
npx prisma migrate deploy   # contêiner/prod

# Prisma Studio (local)
npx prisma studio  # http://localhost:5555
```

---

## ✉️ E-mail (Nodemailer/Gmail)

1. Ativar **2FA** na conta Gmail.
2. Criar **Senha de App** (tipo "Mail" / "Windows").
3. Preencher `SMTP_USER` e `SMTP_PASS` (senha de app) em `api/.env`.
4. Testar com `POST /password/forgot`.

---

## 🧯 Troubleshooting

* **`EADDRINUSE :3000`**

  * Encerrar processos Node antigos (`taskkill /F /IM node.exe` no Windows) ou usar `next start -p 3002`.
* **`process.env.DATABASE_URL` undefined no container**

  * Checar `env_file`/`environment` no `docker-compose.*.yml` e o `.env`.
  * Validar no container:

    ```bash
    docker exec -it clinid_api sh -lc 'node -e "console.log(process.env.DATABASE_URL)"'
    ```
* **`Cannot find module 'nodemailer'`**

  * `cd api && npm i nodemailer` e rebuild da API:

    ```bash
    docker compose -f C:\Users\rafae\clinid\docker-compose.dev.yml up -d --build api
    ```

---

## 📋 Checklist de Entrega

* [x] Login/Registro (privado)
* [x] Cadastro Clínico (CRUD básico)
* [x] Histórico (read-only)
* [x] QR + PIN (hash) e página de impressão
* [x] Esqueci/Resetar Senha (e-mail)
* [x] Docker Compose (dev/prod)
* [x] Prisma Migrations/Generate
* [x] Postman (coleção + ambiente)
* [ ] Testes automatizados (unit/e2e)
* [ ] CI/CD e observabilidade 

---

## 📝 Licença

Este projeto é distribuído sob a licença **MIT**. Veja `LICENSE` para mais detalhes.

---

> *Dica:* adicione screenshots das telas principais em `docs/screenshots/` e referencie aqui para enriquecer sua apresentação.
