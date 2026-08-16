#!/usr/bin/env bash
set -e

# ===================================================================
# SkillMatrix Docker Offline Image Saver (Online Environment)
# ===================================================================

echo "Building SkillMatrix Docker image..."
docker build -t skillmatrix-app:latest -f docker/Dockerfile .

echo "Saving image to tar file for offline transport..."
docker save -o skillmatrix-offline-image.tar skillmatrix-app:latest

echo "Done! Transfer 'skillmatrix-offline-image.tar', 'docker-compose.yml', and '.env.example' to the offline host."
