# Docker デプロイ手順（VPS想定）

この手順では、Django(API) + PostgreSQL + Caddy(リバプロ/自動TLS) を最小構成で起動します。低メモリを意識して、ASGI(Uvicorn)で運用します。

## 構成
- `docker/backend.Dockerfile` : Uvicorn で Django を起動
- `docker/docker-compose.yml` : db/backend/caddy の3サービス
- `docker/Caddyfile` : 80/443 で backend:8000 にリバースプロキシ

## 前提
- VPS に Docker / Docker Compose が導入済み
- DNS でドメイン `api.example.com` を VPS に向け済み

## .env を用意
プロジェクトルートに `.env` を作成して、以下を設定:

```
DJANGO_SECRET_KEY=本番用の長いランダム文字列
POSTGRES_PASSWORD=強固なパスワード
DOMAIN=api.example.com
```

## 起動
```
cd docker
docker compose up -d --build
```
- 初回は `backend` コンテナ起動時に `python manage.py migrate` が自動実行されます

## データ投入（任意）
```
# ユーザー・地理マスタ・Trips の順で投入
docker compose exec backend python manage.py load_users_seed --clean
docker compose exec backend python manage.py load_geo_seed --clean
docker compose exec backend python manage.py load_trips_seed --clean
```

## フロント接続（Netlify など）
- 環境変数 `VITE_API_BASE_URL=https://api.example.com/api` を設定し、再デプロイ

## メモリを更に抑えるには
- Uvicorn 単体で充分ですが、Gunicorn を使う場合は以下のように最小構成
  - `gunicorn server.asgi:application -k uvicorn.workers.UvicornWorker --workers 1 --threads 2 --bind 0.0.0.0:8000 --max-requests 500 --max-requests-jitter 50`
  - 上記を Dockerfile の CMD に置き換え

## 運用コマンド
```
# ログ
docker compose logs -f backend

# コンテナ再起動
docker compose restart backend

# マイグレーション
docker compose exec backend python manage.py migrate
```

## 参考
- 本番CORS/ALLOWED_HOSTS は `server/settings.py` でドメインを絞ることを推奨
- Admin静的配信が必要なら Whitenoise 追加、または Caddy から別パスで静的配信
