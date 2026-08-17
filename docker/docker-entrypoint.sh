#!/bin/sh
set -e

# アップロードディレクトリが存在しない場合は作成
mkdir -p /app/uploads

# ボリュームマウント時の権限不整合を解消するため所有権を node:node に設定
chown -R node:node /app/uploads

# nodeユーザーに権限を降格してCMDを実行
exec su-exec node "$@"
