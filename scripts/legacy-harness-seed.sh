#!/usr/bin/env bash
#
# Seeds the local legacy Spring harness to prod shape for the mobile-compat golden suite.
#
# Idempotent: safe to re-run. Harness data is ephemeral (the compose declares no named
# volume), so this must be re-run after every container recreate.
#
# The compose lives OUTSIDE this repo at ~/projects/contrib/tdp/local/docker-compose.yml and
# is pinned to postgres:17-alpine to match legacy prod 17.5 (a PG16 server cannot restore a
# PG17 dump). The mobile-backend / mobile-ios clones are READ-ONLY and are never touched.
#
# The bcrypt hash below is a FIXED COMMITTED CONSTANT, never generated per run: htpasswd
# mints a random salt each invocation, and the harness row and the platform row must hold the
# byte-identical hash or the golden flakes on every re-seed and reads as a bcrypt-compat
# failure. Source of truth: packages/api-server/src/test/golden-fixture.ts
# (GOLDEN_BCRYPT_HASH / GOLDEN_PASSWORD). Keep the two in sync.

set -euo pipefail

COMPOSE_FILE="${TDP_LEGACY_COMPOSE:-$HOME/projects/contrib/tdp/local/docker-compose.yml}"
BACKEND_SRC="${TDP_LEGACY_BACKEND_SRC:-$HOME/projects/contrib/tdp/mobile-backend/backend}"
DB_CONTAINER="${TDP_LEGACY_DB_CONTAINER:-tdp_legacy_db}"
DB_USER="tdp"
DB_NAME="tdp"
BASE_URL="${TDP_LEGACY_BASE_URL:-http://localhost:8080/api/v1}"

GOLDEN_BCRYPT_HASH='$2a$10$xGFVeUFmZ9fBD3ihEPQZt.bl85fgMvCX0kdxA71xYpPDT4f72oiAy'

export DOCKER_CONFIG="${DOCKER_CONFIG:-$HOME/projects/contrib/tdp/local/.docker}"

psql_do() {
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
}

echo "==> bringing the harness up"
docker compose -f "$COMPOSE_FILE" up -d --wait

echo "==> applying legacy schema"
# Applied best-effort, and its exit status is deliberately not trusted: psql without
# ON_ERROR_STOP returns 0 even when statements fail, and on any run after the first this
# file legitimately errors — individual_programs lacks IF NOT EXISTS, and the three catalog
# INSERTs collide with their own primary keys. Those errors ARE the steady state.
# The postcondition is checked below instead, which is the thing that actually matters.
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
  <"$BACKEND_SRC/src/main/resources/schema.sql" >/dev/null 2>&1 || true

echo "==> verifying schema postcondition"
for table in training_levels user_roles user_plans users general_programs individual_programs; do
  if ! found="$(psql_do -tAc "SELECT to_regclass('public.$table')")"; then
    echo "FAILED: could not query the harness database while checking '$table'" >&2
    exit 1
  fi

  if [ "$(printf '%s' "$found" | tr -d '[:space:]')" != "$table" ]; then
    echo "FAILED: table '$table' is missing after applying schema.sql" >&2
    exit 1
  fi
done

echo "==> seeding catalogs to prod shape"
psql_do -c "
  INSERT INTO training_levels (id, name) VALUES
    (1,'Scaled'),(2,'Pro'),(3,'Advanced'),(4,'Functional Bodybuilding')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  INSERT INTO user_plans (id, name) VALUES (1,'General'),(2,'Individual')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  INSERT INTO user_roles (id, name) VALUES (1,'USER'),(2,'ADMIN')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  SELECT setval(pg_get_serial_sequence('training_levels','id'), (SELECT max(id) FROM training_levels));
  SELECT setval(pg_get_serial_sequence('user_plans','id'), (SELECT max(id) FROM user_plans));
  SELECT setval(pg_get_serial_sequence('user_roles','id'), (SELECT max(id) FROM user_roles));
" >/dev/null

echo "==> seeding golden users"
psql_do -c "
  INSERT INTO users
    (id, is_enabled, username, password, user_role_id, user_plan_id, training_level_id, first_name, last_name)
  VALUES
    (1001, true,  'athlete@tdp.local',    '$GOLDEN_BCRYPT_HASH', 1, 1, 2, 'Test', 'Athlete'),
    (1002, true,  'admin@tdp.local',      '$GOLDEN_BCRYPT_HASH', 2, 1, 2, 'Root', 'Admin'),
    (1003, false, 'disabled@tdp.local',   '$GOLDEN_BCRYPT_HASH', 1, 1, 1, 'Dis',  'Abled'),
    (1004, true,  'individual@tdp.local', '$GOLDEN_BCRYPT_HASH', 1, 2, 2, 'Indi', 'Vidual')
  ON CONFLICT (id) DO UPDATE SET
    is_enabled        = EXCLUDED.is_enabled,
    username          = EXCLUDED.username,
    password          = EXCLUDED.password,
    user_role_id      = EXCLUDED.user_role_id,
    user_plan_id      = EXCLUDED.user_plan_id,
    training_level_id = EXCLUDED.training_level_id,
    first_name        = EXCLUDED.first_name,
    last_name         = EXCLUDED.last_name;
  SELECT setval(pg_get_serial_sequence('users','id'), (SELECT max(id) FROM users));
" >/dev/null

echo "==> clearing program rows"
psql_do -c "TRUNCATE general_programs, individual_programs RESTART IDENTITY;" >/dev/null

echo "==> verifying"
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/auth/signin" \
  -H 'Content-Type: application/json' \
  -d '{"username":"athlete@tdp.local","password":"Admin123!"}')

if [ "$status" != "200" ]; then
  echo "FAILED: harness signin returned $status, expected 200" >&2
  exit 1
fi

curl -s "$BASE_URL/trainingLevel/all"
echo
curl -s "$BASE_URL/userPlans"
echo
echo "==> harness seeded"
