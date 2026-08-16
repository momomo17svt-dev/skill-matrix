# Ubuntu / Docker オフラインデプロイ設計書

## 1. 概要
Ubuntu Linux 閉域環境において、Docker Hub等へのアクセスを行わずにコンテナベースで SkillMatrix を起動するための手順です。

## 2. オンライン事前準備 (ビルド & tar保存)
インターネット接続可能なマシンで以下を実行します：
```bash
# 1. コンテナイメージのビルド
docker compose -f docker/docker-compose.build.yml build

# 2. tarファイルとして保存
docker save -o skillmatrix-offline-images.tar skillmatrix-backend:latest skillmatrix-frontend:latest
```

## 3. オフライン本番環境での展開
閉域環境に `skillmatrix-offline-images.tar`, `docker-compose.yml`, `.env.example`, `scripts/` を持ち込みます：
```bash
# 1. イメージの読み込み (外部Pullなし)
docker load -i skillmatrix-offline-images.tar

# 2. 環境設定
cp .env.example .env
nano .env # SQL Server 接続文字列やシークレットを設定

# 3. DBマイグレーション (明示的実行)
./docker/migrate.sh

# 4. コンテナ起動 (pull-policy: never)
docker compose -f docker/docker-compose.yml up -d

# 5. ヘルスチェック
curl -f http://localhost:3000/health
```
