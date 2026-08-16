#!/usr/bin/env bash
set -e

# ===================================================================
# SkillMatrix Docker Offline Image Saver (Online Environment)
# Bundles both SkillMatrix App and PostgreSQL 16 Alpine
# ===================================================================

mkdir -p images

echo "1/3 Pulling lightweight PostgreSQL 16 Alpine image (approx 85MB)..."
docker pull postgres:16-alpine

echo "2/3 Building SkillMatrix Docker image..."
docker build -t skillmatrix-app:latest -f docker/Dockerfile .

echo "3/3 Saving all-in-one image archive (App + PostgreSQL) to images/skillmatrix-offline-image.tar..."
docker save -o images/skillmatrix-offline-image.tar skillmatrix-app:latest postgres:16-alpine

echo "Done! Total offline bundle created at: images/skillmatrix-offline-image.tar"
echo "Transfer 'images/skillmatrix-offline-image.tar', 'docker/docker-compose.yml', and '.env.example' to the offline host."
