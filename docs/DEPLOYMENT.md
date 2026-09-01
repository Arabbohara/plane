# Vegecoop Project Management System — Deployment & Access

This is a self-hosted fork of [Plane](https://github.com/makeplane/plane), rebranded to
"Vegecoop Project Management System", running on a single AWS EC2 instance via Docker
Compose.

## Access

| App                        | URL                             | Notes                                                      |
| -------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Main app                   | `http://13.230.86.17/`          | Sign in / workspaces                                       |
| Admin console ("God Mode") | `http://13.230.86.17/god-mode/` | Instance-wide settings: email, storage, AI, auth providers |
| Publish (Space)            | `http://13.230.86.17/spaces/`   | Public board/roadmap sharing                               |

The IP is an **Elastic IP**, so it stays fixed across instance stops/starts unless someone
explicitly re-associates it. If it ever changes again, see "Changing the server IP" below —
several places need updating in lockstep or the app breaks.

### God Mode (Instance Admin) access

God Mode requires the signed-in account to be registered as an **Instance Admin** — this is
separate from being a workspace owner/admin. Only one account has this by default (whoever
completed the original one-time setup).

To grant another existing user account Instance Admin rights, run on the server:

```bash
docker exec api python manage.py create_instance_admin <user-email>
```

This only adds a permission row — it does not touch the account's password.

## Architecture

Docker Compose services (see `docker-compose.yml`):

| Service                      | Role                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `web`                        | Main frontend (React Router / Next-style app)                                                   |
| `admin`                      | God Mode admin frontend                                                                         |
| `space`                      | Public "Publish" frontend                                                                       |
| `api`                        | Django REST API                                                                                 |
| `worker` (`bgworker`)        | Celery background tasks (emails, exports, notifications)                                        |
| `beat-worker` (`beatworker`) | Celery beat scheduler (periodic tasks)                                                          |
| `migrator`                   | Runs DB migrations on deploy, then exits                                                        |
| `live` (`plane-live`)        | Realtime collab server (Yjs/Hocuspocus) for Pages                                               |
| `plane-db`                   | PostgreSQL                                                                                      |
| `plane-redis`                | Redis (Valkey) — cache, Celery broker support                                                   |
| `plane-mq`                   | RabbitMQ — Celery task queue                                                                    |
| `plane-minio`                | MinIO — S3-compatible object storage for uploads/avatars/attachments                            |
| `proxy`                      | Caddy reverse proxy — routes `/api`, `/god-mode`, `/spaces`, `/uploads`, `/live`, and `/` (web) |

All app containers (`api`, `worker`, `beat-worker`, `live`, `migrator`) read env vars from
`apps/api/.env` (and `apps/live/.env` for `live`). The `plane-db`, `plane-mq`, `plane-minio`,
and `proxy` services read from the repo-root `.env`. **These two `.env` files must be kept in
sync on shared values** (storage endpoint, bucket name) — a mismatch here was the root cause
of a broken avatar/attachment upload bug (`USE_MINIO`/`AWS_S3_ENDPOINT_URL` disagreed between
the two files).

## Deployment

### Automatic (normal path)

Pushing to the `vegecoop-main` branch triggers
[`.github/workflows/deploy-vegecoop-ec2.yml`](../.github/workflows/deploy-vegecoop-ec2.yml),
which SSHes into the server and:

1. Backs up the Postgres DB (`pg_dump`, keeps the last 14 backups in `~/backups/`)
2. `git fetch` + `git reset --hard origin/vegecoop-main`
3. `docker compose -f docker-compose.yml up -d --build`
4. Health-checks `/api/instances/` for up to 60s

This requires three repo secrets under **Settings → Secrets and variables → Actions**:
`EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`.

**Important:** any change to a shared package (`packages/constants`, `packages/i18n`, `packages/ui`,
etc.) invalidates the Docker build cache for every app that depends on it (`web`, `admin`,
`space` all do). A deploy that only changes app-level code finishes in under a minute; a deploy
that touches a shared package can take 20–40+ minutes on this instance, because it forces a
much heavier rebuild and the box is I/O-constrained under load (`top` shows high `%wa` during
these builds). This is expected, not a hang — check `docker ps` (are `web`/`admin`/`space`
`CREATED AT` timestamps recent?) and `ps aux | grep docker-buildx` (is the build process still
alive?) before assuming it's stuck.

### Manual deploy (if needed)

```bash
ssh ec2-user@13.230.86.17
cd /home/ec2-user/plane
git pull origin vegecoop-main
docker compose -f docker-compose.yml up -d --build
```

To restart just the backend without a full rebuild (e.g. after an `.env` change only):

```bash
docker compose -f docker-compose.yml up -d --no-deps api worker beat-worker live
```

## Configuration reference

Both `.env` files are git-ignored — they exist only on the server (and whatever machine you
edit them from), never in the repo. Keep local backups.

Key settings in `apps/api/.env`:

- **Storage**: `USE_MINIO=1`, `AWS_S3_ENDPOINT_URL="http://plane-minio:9000"` — must point at
  the internal Docker service name, not `localhost` and not the public IP. The proxy
  (`apps/proxy/Caddyfile.ce`) forwards `/{bucket}/*` requests to `plane-minio:9000`, and
  presigned upload URLs are built from the request's public host, so the browser talks to the
  public IP while the API talks to MinIO internally.
- **Email**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_FROM`,
  `EMAIL_USE_TLS`/`EMAIL_USE_SSL` — can also be set live via God Mode → Settings → Email (writes
  to the DB, takes effect immediately, no restart needed). If invites silently don't arrive,
  check `docker logs bgworker` for `SMTPAuthenticationError` — that's the mail server rejecting
  the login, not a Plane-side bug.
- **URLs**: `WEB_URL`, `APP_BASE_URL`, `ADMIN_BASE_URL`, `SPACE_BASE_URL`, `LIVE_BASE_URL`,
  `CORS_ALLOWED_ORIGINS` — all must match the current public address. `apps/live/.env` has its
  own `WEB_BASE_URL`/`LIVE_BASE_URL` copies that also need updating.
- **AI**: `LLM_API_KEY` (God Mode → Settings → AI) — the "I'm feeling lucky" / GPT-assistant /
  Pages AI menu features in the app only appear once a non-empty key is set; no separate
  on/off toggle exists.
- **Signup restriction**: `RESTRICT_SIGNUP_DOMAIN` (default `vegecoop.co.jp`) — account creation
  (email/password, magic link, and every OAuth provider) is rejected for any email outside this
  domain, regardless of `ENABLE_SIGNUP` or an existing workspace invite. Enforced centrally in
  `apps/api/plane/authentication/adapter/base.py` (`Adapter.__check_signup`). Set it empty to
  remove the restriction entirely; existing accounts and sign-_in_ are unaffected either way.

## Changing the server IP (Elastic IP reassociation)

If the Elastic IP ever changes again, update all of these, then restart the affected
containers:

1. `apps/api/.env`: `CORS_ALLOWED_ORIGINS`, `WEB_URL`, `ADMIN_BASE_URL`, `SPACE_BASE_URL`,
   `APP_BASE_URL`, `LIVE_BASE_URL`
2. `apps/live/.env`: `WEB_BASE_URL`, `LIVE_BASE_URL`
3. `packages/constants/src/metadata.ts`: `SITE_URL`, `SPACE_SITE_URL` (cosmetic, but keeps
   OG/meta tags accurate)
4. The `EC2_HOST` GitHub Actions secret (or the next auto-deploy will fail to SSH in)
5. Recreate containers: `docker compose -f docker-compose.yml up -d --no-deps api worker beat-worker live`

## Backups

Postgres dumps are taken automatically on every deploy, stored in `~/backups/` on the server as
`backup-<timestamp>.pgdump`, with the 14 most recent kept.

## Migrating your local database to AWS (overwrite)

[`deployments/vegecoop/migrate-local-db-to-aws.sh`](../deployments/vegecoop/migrate-local-db-to-aws.sh)
replaces the live database on `$EC2_HOST` with a dump of your local database. This is
destructive on the AWS side — read the script's header before running it. It always takes a
backup of the current remote DB first and prints rollback instructions at the end.

```bash
EC2_KEY=/path/to/key.pem ./deployments/vegecoop/migrate-local-db-to-aws.sh
```

It requires `ssh`/`scp`/`docker` locally and a `.pem` key with access to the EC2 instance
(the same one used for `EC2_SSH_KEY` in GitHub Actions, if you have a local copy — it is not
retrievable from GitHub secrets). It stops `api`, `worker`, `beat-worker`, `live`, and
`migrator` on the server during the restore, then brings everything back up (which also
re-runs pending migrations against the restored data).

## Known quirks

- On Windows checkouts of this repo, `packages/i18n/locales` is a symlink to
  `packages/i18n/src/locales`. If `git config core.symlinks` is `false` but a real OS symlink
  already exists at that path (common after certain tooling), running `git checkout` on that
  path can delete the real target directory's contents. If you ever see hundreds of locale
  files listed as deleted, don't panic — they're fully tracked in git; `git checkout HEAD --
packages/i18n/src/locales` restores them instantly.
