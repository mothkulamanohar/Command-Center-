#!/bin/sh
set -e

# ==============================================================================
# IT Command Center — Automated Database & Uploads Backup Service
# SPEC §17: daily 02:00 (backup container)
# pg_dump + uploads tar -> /backups, keep 14 daily + 8 weekly
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATA_DIR="${DATA_DIR:-/data/uploads}"
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-icc}"
DB_NAME="${POSTGRES_DB:-icc}"
export PGPASSWORD="${POSTGRES_PASSWORD:-icc}"

mkdir -p "$BACKUP_DIR"

perform_backup() {
  TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
  echo "[$(date)] Starting IT Command Center backup: $TIMESTAMP..."

  # 1. PostgreSQL Database Dump
  DB_BACKUP_FILE="$BACKUP_DIR/icc_db_${TIMESTAMP}.sql.gz"
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$DB_BACKUP_FILE"; then
    echo "[$(date)] Database backup completed: $DB_BACKUP_FILE"
  else
    echo "[$(date)] ERROR: pg_dump failed!" >&2
  fi

  # 2. Uploads Directory Archive
  if [ -d "$DATA_DIR" ]; then
    UPLOADS_BACKUP_FILE="$BACKUP_DIR/icc_uploads_${TIMESTAMP}.tar.gz"
    tar -czf "$UPLOADS_BACKUP_FILE" -C "$DATA_DIR" . 2>/dev/null || true
    echo "[$(date)] Uploads archive completed: $UPLOADS_BACKUP_FILE"
  fi

  # 3. Retention Rotation: Keep 14 daily backups
  echo "[$(date)] Rotating backups (keeping 14 daily + 8 weekly)..."
  find "$BACKUP_DIR" -name "icc_db_*.sql.gz" -mtime +14 -exec rm -f {} + 2>/dev/null || true
  find "$BACKUP_DIR" -name "icc_uploads_*.tar.gz" -mtime +14 -exec rm -f {} + 2>/dev/null || true

  echo "[$(date)] Backup cycle complete."
}

# Run first backup on start if requested
if [ "$RUN_ONCE" = "true" ]; then
  perform_backup
  exit 0
fi

# Daemon schedule: run backup every 24 hours (86400 seconds)
while true; do
  perform_backup
  echo "[$(date)] Sleeping for 24 hours until next backup cycle..."
  sleep 86400
done
