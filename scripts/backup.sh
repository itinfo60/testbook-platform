#!/bin/sh
# MongoDB backup script — runs daily inside the mongo-backup container
set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"

echo "[$(date)] Starting MongoDB backup..."
mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH" --gzip

echo "[$(date)] Backup completed: $BACKUP_PATH"

# Retain only last 7 days of backups
find "$BACKUP_DIR" -maxdepth 1 -name "backup_*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "[$(date)] Old backups cleaned. Current backups:"
ls -lh "$BACKUP_DIR"
