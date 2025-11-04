# Calendar App - ブランチ構成

このドキュメントは、プロジェクトのブランチ構造と派生関係を記録しています。

## ブランチ構造図

```
main
├── drf-persistence           # Django REST Framework バックエンド実装
│   └── (ユーザー/地理マスタ追加)
│
├── fe-api-integration        # フロントエンドAPI統合
│   ├── docker-deploy         # Docker環境構築
│   └── api-tests             # APIテスト（Postman/pytest）
│
└── (その他のブランチ)
```

## ブランチ詳細

### `main`
- **目的**: メインブランチ（ベース）
- **状態**: プロダクション用の安定版
- **派生元**: なし（ルートブランチ）

### `drf-persistence`
- **目的**: Django REST Frameworkを使ったバックエンドの永続化実装
- **派生元**: `main`
- **実装内容**:
  - Django REST Framework バックエンドセットアップ
  - SQLiteデータベース（後でPostgreSQLに移行予定）
  - TripモデルとCRUD API
  - Notification, Comment, DateProposal, DateVoteモデルとAPI
  - Region, Country, Cityモデル（地理マスタ）
  - UserProfileモデル（ユーザーマスタ）
  - Django管理コマンド（シードデータロード）
- **マージ状況**: `fe-api-integration`にマージ済み

### `fe-api-integration`
- **目的**: フロントエンドとバックエンドAPIの統合
- **派生元**: `main`（最初は独立開発、後に`drf-persistence`をマージ）
- **実装内容**:
  - フロントエンドAPI統合（`src/utils/api.ts`）
  - UsersAPI, GeoAPIの実装
  - localStorageからAPI呼び出しへの移行
  - ユーザーキャッシュ機能（`src/utils/users.ts`）
  - 地理データフック（`src/hooks/useGeoData.ts`）
  - コメントパネル実装
- **マージ状況**: `drf-persistence`をマージ済み
- **派生ブランチ**: `docker-deploy`, `api-tests`

### `docker-deploy`
- **目的**: Docker環境でのバックエンドデプロイ設定
- **派生元**: `fe-api-integration`
- **実装内容**:
  - `docker/backend.Dockerfile`（Django/uvicorn）
  - `docker/docker-compose.yml`（Postgres + Backend + Caddy）
  - `docker/Caddyfile`（リバースプロキシ設定）
  - `DEPLOY_DOCKER.md`（デプロイ手順）
- **マージ状況**: `fe-api-integration`の最新変更をマージ済み

### `api-tests`
- **目的**: バックエンドAPIの単体テスト・統合テスト
- **派生元**: `fe-api-integration`
- **実装内容**:
  - `tests/postman_collection.json`（Postmanコレクション）
  - `tests/test_api_integration.py`（pytest統合テスト）
  - `tests/README.md`（テスト実行方法）
- **マージ状況**: `fe-api-integration`の最新変更をマージ済み

## 開発フロー

1. **バックエンド開発**: `drf-persistence`ブランチで作業
2. **フロントエンド統合**: `fe-api-integration`ブランチで作業（`drf-persistence`をマージ）
3. **デプロイ準備**: `docker-deploy`ブランチで作業
4. **テスト**: `api-tests`ブランチで作業

## マージ履歴

- `fe-api-integration` ← `drf-persistence` マージ済み（2024年）
- `docker-deploy` ← `fe-api-integration` マージ済み
- `api-tests` ← `fe-api-integration` マージ済み

## 次のステップ

- 各ブランチの動作確認とテスト
- `fe-api-integration`を`main`にマージ（準備ができたら）
- PostgreSQLへの移行（`drf-persistence`で対応予定）
- 本番環境へのデプロイ（`docker-deploy`使用）

## 注意事項

- `main`ブランチは常に安定状態を保つ
- 機能追加は各ブランチで作業し、動作確認後に`main`へマージ
- `fe-api-integration`は`drf-persistence`の変更を取り込む必要がある
