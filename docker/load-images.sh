#!/usr/bin/env bash
set -e

# ===================================================================
# SkillMatrix Docker Offline Image Loader (Offline Environment)
# ===================================================================

if [ ! -f "skillmatrix-offline-image.tar" ]; then
    echo "ERROR: skillmatrix-offline-image.tar not found!"
    exit 1
fi

echo "Loading SkillMatrix Docker image from tar file..."
docker load -i skillmatrix-offline-image.tar

echo "Image successfully loaded! You can now start the application via:"
echo "  docker compose -f docker/docker-compose.yml up -d"
