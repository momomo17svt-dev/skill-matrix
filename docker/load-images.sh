#!/usr/bin/env bash
set -e

# ===================================================================
# SkillMatrix Docker Offline Image Loader (Offline Environment)
# ===================================================================

TAR_PATH="images/skillmatrix-offline-image.tar"
if [ ! -f "$TAR_PATH" ]; then
    TAR_PATH="skillmatrix-offline-image.tar"
fi

if [ ! -f "$TAR_PATH" ]; then
    echo "ERROR: skillmatrix-offline-image.tar not found in ./images/ or current directory!"
    exit 1
fi

echo "Loading SkillMatrix Docker image from $TAR_PATH..."
docker load -i "$TAR_PATH"

echo "Image successfully loaded! You can now start the application via:"
echo "  docker compose -f docker/docker-compose.yml up -d"
