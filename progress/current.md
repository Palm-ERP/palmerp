# Sesión Actual — Palmera Core

**Estado:** Completada.

**Feature:** #9 Sistema Triple Backup Desacoplado (Local + Vault + Storage Cliente) 02:00 — `done`

**Plan ejecutado 2026-09-15:**
- `prisma/schema.prisma:1` + `BackupLog` con enums `BackupDestination/BackupKind/BackupStatus`, relación `Tenant.backupLogs`, `npx prisma generate` OK, `npx tsc --noEmit` OK, `npm run build` OK 66 rutas
- `src/lib/backup/crypto.ts:1` AES-256-GCM solo clave cliente `BACKUP_ENCRYPTION_KEY` (iv12+tag16+ciphertext), sha256, sin clave maestra Palmerp
- `src/lib/backup/storage-provider.ts:1` 3 providers: LOCAL `/data/backups/palmerp` 7d, CLIENT_STORAGE `CLIENT_BACKUP_S3_*` 30d, PALMERP_VAULT `PALMERP_VAULT_R2_*` 90d inmutable (vault prefix `vault/tenants/...`), `retentionDateStr`
- `src/lib/backup/runner.ts:1` genera ambos artefactos: logical JSON filtrado tenantId (gzip+encrypt+checksum+BackupLog) + physical `pg_dump` si binario existe (agente local), retención diferenciada, AuditLog BACKUP_RUN
- `src/app/api/cron/daily-backups/route.ts:1` refactorizado a `runBackupAllTenants` 02:30, `vercel.json:24` `30 2 * * *`
- `scripts/backup-agent.mjs:1` agente systemd 02:00 MiniPC siempre ON, pull directo `DATABASE_URL` + Prisma, sube a A/B/C aunque Vercel caiga, heartbeat `PALMERP_CONTROL_URL/api/fleet/backup-heartbeat`
- `src/app/api/admin/restore/route.ts:1` GET lista BackupLog, POST dryRun descifra+gunzip+valida JSON o restore users, physical requiere `psql < dump.sql` manual
- `src/app/api/fleet/backup-heartbeat/route.ts:1` POST heartbeat + GET semáforo (verde <24h, amarillo 24-48h, rojo >48h)
- `.env.example:45` documentadas vars triple backup, `package.json:14` script `backup:agent`
- `./init.sh` verde, feature_list #9 `done`, #8 sigue `blocked` (retomar tras backup)

## 2026-09-30 — Conversaciones → Gmail (núcleo)
- `src/app/admin/conversations/page.tsx`: reescrito como clon Gmail (sidebar Recibidos/Destacados/Pospuestos/Enviados/Borradores/Spam/Papelera, pestañas Principal/Promociones/Social/Actualizaciones, hilos, lectura, redactar+responder, selección múltiple, papelera/spam/posponer). Store propio `palmera_emails_<slug>`, no depende del pipeline contacts→audit (roto en belpane).
- `src/app/admin/conversations/audit/page.tsx`: auditoría original restaurada (HEAD) como vista propia; ruta `/admin/conversations/audit` intacta.
- `src/lib/clientStorage.ts`: backport `getPinnedSlugClient`/`getDefaultSlug` (idéntico a belpane/getloudspace) para `NEXT_PUBLIC_PINNED_TENANT_SLUG`; sin el pin el comportamiento es el legacy.
- `./init.sh` verde (tsc + prisma).

## 2026-09-30 — Fix updates fleet (rama master) + v0.2.0
- `src/lib/fleet/upstream.ts`: DEFAULT_BRANCH main→master (el remoto no tiene rama main) + export getRepoAndBranch.
- `src/app/api/admin/updates/route.ts` y `settings/updates/page.tsx`: comandos/enlace commits dinámicos según upstream detectado.
- `scripts/fleet-update.mjs`, `.env.example`: defaults a master.
- `package.json`: 0.1.0→0.2.0 (detección por semver).

## 2026-09-30 — Anti datos-cruzados auth + audit tenant (núcleo)
- `src/lib/instance.ts` (nuevo, Edge-safe): id de instancia (PINNED_TENANT_SLUG > NEXT_PUBLIC_PINNED_TENANT_SLUG > PALMERP_INSTANCE_ID > palmerp) + nombres de cookie por instancia con prefijos __Secure-/__Host- en https.
- `src/lib/auth.ts`: cookies sessionToken/callbackUrl/csrfToken con nombre propio (fix raíz: will@getloud.space aparecía en palmerp por misma cookie+secreto+localhost) + guard de login que rechaza otros tenants si hay pin (backport getloudspace).
- `src/middleware.ts`: getToken con cookieName de instancia (sin esto nadie pasaba /admin).
- `src/app/admin/contacts/page.tsx`: audit a clave tenant (antes legacy global) + merge sin pérdida + evento live.
- `.env.example`: documentados PINNED_TENANT_SLUG / NEXT_PUBLIC_PINNED_TENANT_SLUG.
- Verificado: tsc OK, eslint sin errores nuevos, npm run build OK, helpers testeados en node (palmerp/belpane/getloud/https).
- Nota: /api/auth/* da 500 en dev local por next/font/google sin internet (pre-existente, no de este cambio); en Vercel funciona.
