#!/usr/bin/env bash
set -e

# ===================================================================
# SkillMatrix Docker Migration Runner (Explicit)
# ===================================================================

echo "Running SkillMatrix Database Migration inside Docker container..."
docker compose -f docker/docker-compose.yml run --rm app npx prisma db push --schema=./packages/backend/prisma/schema.prisma --accept-data-loss

echo "Migration completed successfully."
