#!/usr/bin/env bash
set -e

# ===================================================================
# SkillMatrix Docker Offline Image Saver (Online Environment)
# ===================================================================

mkdir -p images

echo "Building SkillMatrix Docker image..."
docker build -t skillmatrix-app:latest -f docker/Dockerfile .

echo "Saving image to images/skillmatrix-offline-image.tar for offline transport..."
docker save -o images/skillmatrix-offline-image.tar skillmatrix-app:latest

echo "Done! Offline image archive created at: images/skillmatrix-offline-image.tar"
echo "Transfer 'images/skillmatrix-offline-image.tar', 'docker/docker-compose.yml', and '.env.example' to the offline host."
