# 開発引き継ぎドキュメント

このドキュメントは、次のAI Agentが開発を継続するための詳細な情報を記載しています。

**作成日**: 2024年12月  
**プロジェクト**: 海外旅行コミュニティアプリ（Calendar App）  
**リポジトリ**: https://github.com/kazuu234/caldemo

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [ブランチ構成と開発内容](#ブランチ構成と開発内容)
4. [バックエンド実装詳細](#バックエンド実装詳細)
5. [フロントエンド実装詳細](#フロントエンド実装詳細)
6. [API仕様](#api仕様)
7. [データベース構造](#データベース構造)
8. [デプロイ設定](#デプロイ設定)
9. [テスト](#テスト)
10. [既知の問題と注意事項](#既知の問題と注意事項)
11. [次のステップ](#次のステップ)

---

## プロジェクト概要

### アプリケーションの目的
海外旅行のコミュニティアプリで、ユーザーが旅行予定を共有し、現地で合流できる機能を提供します。

### 主な機能
- **旅行予定管理**: カレンダー/リストビューで予定を表示・管理
- **合流募集**: 旅行先で合流できる仲間を募集
- **オフ会管理**: 日本国内・海外でのオフ会開催、日程候補投票
- **通知システム**: HTML5通知API + Badging API
- **Discord連携**: （将来的に実装予定）

### 開発経緯
- 元々はFigma Makeで生成されたフロントエンドコード
- localStorageでデータ管理していたが、Django REST Frameworkバックエンドに移行中
- Netlifyでフロントエンドをホスティング
- バックエンドはVPS + Dockerでデプロイ予定

---

## 技術スタック

### フロントエンド
- **フレームワーク**: React 18+ with TypeScript
- **ビルドツール**: Vite
- **UIライブラリ**: 
  - Tailwind CSS
  - shadcn/ui（コンポーネントライブラリ）
- **主要ライブラリ**:
  - `react-router-dom` v6（ルーティング）
  - `lucide-react`（アイコン）
  - `date-fns`（日付処理）
  - `sonner`（Toast通知）
- **ホスティング**: Netlify

### バックエンド
- **フレームワーク**: Django 5.0+ with Django REST Framework 3.15+
- **データベース**: 
  - 開発: SQLite
  - 本番: PostgreSQL（移行予定）
- **ASGIサーバー**: Uvicorn
- **WSGIサーバー**: Gunicorn（オプション）
- **CORS**: django-cors-headers
- **ホスティング**: VPS + Docker（予定）

### 開発ツール
- **バージョン管理**: Git
- **APIテスト**: 
  - Postman（コレクションあり）
  - pytest（統合テスト）

---

## ブランチ構成と開発内容

### ブランチ構造図

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

詳細は [`BRANCHES.md`](./BRANCHES.md) を参照してください。

---

## バックエンド実装詳細

### ブランチ: `drf-persistence`

#### 実装内容

**1. Django REST Framework セットアップ**
- プロジェクト構造:
  ```
  backend/
  ├── manage.py
  ├── requirements.txt
  ├── server/
  │   ├── __init__.py
  │   ├── settings.py
  │   ├── urls.py
  │   ├── wsgi.py
  │   └── asgi.py
  └── api/
      ├── __init__.py
      ├── models.py
      ├── serializers.py
      ├── views.py
      ├── urls.py
      ├── admin.py
      └── migrations/
  ```

**2. データモデル（`api/models.py`）**

- **Trip**: 旅行予定・オフ会
  - `type`: 'trip' | 'meetup'
  - `user_discord_id`, `user_name`, `user_avatar`
  - `country`, `city`
  - `start_date`, `end_date`
  - `description`
  - `is_recruitment`: 募集フラグ
  - `recruitment_details`: 募集詳細
  - `min_participants`, `max_participants`
  - `participants`: ManyToManyField to UserProfile
  - `is_hidden`: 非表示フラグ
  - `candidate_dates`: JSONField（日程候補）
  - `date_votes`: JSONField（投票）

- **Notification**: 通知
  - `user_discord_id`
  - `trip`: ForeignKey to Trip
  - `type`: 'recruitment' | 'day_before' | 'same_day' | 'comment' | 'other'
  - `title`, `message`
  - `read_at`: 既読日時

- **Comment**: コメント
  - `trip`: ForeignKey to Trip
  - `user_discord_id`, `user_name`
  - `content`
  - `created_at`, `updated_at`

- **DateProposal**: 日程候補
  - `trip`: ForeignKey to Trip
  - `date`: Date
  - `created_by_discord_id`

- **DateVote**: 日程投票
  - `proposal`: ForeignKey to DateProposal
  - `user_discord_id`
  - unique_together: (proposal, user_discord_id)

- **Region**: 地域マスタ
  - `code`: 地域コード（例: 'ASIA', 'EUROPE'）
  - `name`: 地域名（例: 'アジア', 'ヨーロッパ'）

- **Country**: 国マスタ
  - `region`: ForeignKey to Region
  - `name`: 国名
  - `code`: 国コード（オプション）
  - `emoji`: 絵文字（オプション）

- **City**: 都市マスタ
  - `country`: ForeignKey to Country
  - `name`: 都市名

- **UserProfile**: ユーザーマスタ
  - `discord_id`: 一意キー
  - `username`, `display_name`
  - `discriminator`, `avatar`
  - `is_active`
  - `created_at`, `updated_at`

**3. APIエンドポイント（`api/views.py`）**

- **TripsAPI** (`/api/trips/`)
  - `GET /api/trips/`: 一覧取得（フィルタ対応）
  - `GET /api/trips/{id}/`: 詳細取得
  - `POST /api/trips/`: 作成
  - `PATCH /api/trips/{id}/`: 更新
  - `DELETE /api/trips/{id}/`: 削除
  - `POST /api/trips/{id}/join/`: 参加
  - `POST /api/trips/{id}/leave/`: 退出
  - `POST /api/trips/{id}/toggle_recruitment/`: 募集ON/OFF
  - `POST /api/trips/{id}/end_recruitment/`: 募集終了
  - `POST /api/trips/{id}/toggle_hidden/`: 非表示ON/OFF

- **NotificationsAPI** (`/api/notifications/`)
  - `GET /api/notifications/`: 一覧取得
  - `GET /api/notifications/count`: 未読数取得
  - `POST /api/notifications/{id}/mark_read/`: 既読化
  - `POST /api/notifications/mark_all_read/`: 全既読化

- **CommentsAPI** (`/api/comments/`)
  - `GET /api/comments/`: 一覧取得（tripフィルタ）
  - `POST /api/comments/`: 作成
  - `PATCH /api/comments/{id}/`: 更新
  - `DELETE /api/comments/{id}/`: 削除

- **DateProposalsAPI** (`/api/date_proposals/`)
  - `GET /api/date_proposals/`: 一覧取得（tripフィルタ）
  - `POST /api/date_proposals/`: 作成
  - `DELETE /api/date_proposals/{id}/`: 削除
  - `GET /api/date_proposals/{id}/votes/`: 投票一覧
  - `POST /api/date_proposals/{id}/vote/`: 投票
  - `POST /api/date_proposals/{id}/unvote/`: 投票取消

- **UsersAPI** (`/api/users/`)
  - `GET /api/users/`: 一覧取得（検索対応）
  - `GET /api/users/{id}/`: 詳細取得

- **GeoAPI** (`/api/regions/`, `/api/countries/`, `/api/cities/`)
  - `GET /api/regions/`: 地域一覧
  - `GET /api/countries/`: 国一覧（regionフィルタ対応）
  - `GET /api/cities/`: 都市一覧（country/regionフィルタ対応）

**4. Django管理コマンド**

- **`load_geo_seed`**: 地理マスタのシードデータ投入
  ```bash
  python manage.py load_geo_seed [--clean]
  ```
  - `src/components/countries-data.ts` と `src/components/japan-cities-data.ts` をパース
  - `--clean`: 既存データを削除してから投入

- **`load_users_seed`**: ユーザーマスタのシードデータ投入
  ```bash
  python manage.py load_users_seed [--clean]
  ```
  - `src/utils/auth.ts` の `USERS_MASTER` をパース
  - `--clean`: 既存データを削除してから投入

- **`load_trips_seed`**: 旅行予定のシードデータ投入
  ```bash
  python manage.py load_trips_seed [--clean] [--source json|app]
  ```
  - `--source json`: `backend/seed/trips.json` から読み込み
  - `--source app`: `src/App.tsx` の `initialTrips` をパース
  - `--clean`: 既存データを削除してから投入

**5. 設定ファイル**

- **`backend/requirements.txt`**:
  ```
  Django>=5.0,<6.0
  djangorestframework>=3.15,<4.0
  django-cors-headers>=4.3,<5.0
  psycopg[binary]>=3.2,<4.0
  python-dotenv>=1.0,<2.0
  gunicorn
  uvicorn
  ```

- **`backend/server/settings.py`**:
  - SQLiteデータベース設定（開発用）
  - CORS設定（フロントエンドドメイン許可）
  - REST Framework設定

---

## フロントエンド実装詳細

### ブランチ: `fe-api-integration`

#### 実装内容

**1. API統合モジュール（`src/utils/api.ts`）**

- **API_BASE_URL**: 環境変数 `VITE_API_BASE_URL` から取得（デフォルト: `http://localhost:8000/api`）
- **request関数**: 共通のHTTPリクエスト処理
- **APIモジュール**:
  - `TripsAPI`: 旅行予定のCRUD + カスタムアクション
  - `NotificationsAPI`: 通知の取得・既読化
  - `CommentsAPI`: コメントのCRUD
  - `DateProposalsAPI`: 日程候補・投票の管理
  - `UsersAPI`: ユーザー情報の取得
  - `GeoAPI`: 地域・国・都市の取得

**2. ユーザーキャッシュ（`src/utils/users.ts`）**

- `usersCache`: Mapでユーザー情報をキャッシュ
- `initUsers()`: 全ユーザーを取得してキャッシュに保存
- `getUserByDiscordId()`: キャッシュからユーザー情報を取得

**3. 地理データフック（`src/hooks/useGeoData.ts`）**

- `useGeoData()`: 地域・国・都市データを取得するカスタムフック
- 返り値:
  - `regions`: 地域名の配列
  - `countriesByRegion`: 地域別の国マップ
  - `countriesCities`: 国別の都市マップ

**4. コンポーネント変更**

- **`App.tsx`**:
  - `trips` ステートをAPIから取得するように変更
  - `handleAddTrip`, `handleSaveTrip`, `handleDeleteTrip` などをAPI呼び出しに変更
  - `useEffect` で認証時にユーザーキャッシュを初期化
  - `useGeoData` フックを使用

- **`CountryFilter.tsx`**:
  - 静的データ（`COUNTRIES_CITIES`, `REGIONS`）から `useGeoData` フックに変更

- **`AddTripPage.tsx`**, **`AddMeetupPage.tsx`**, **`CreateRecruitmentDialog.tsx`**:
  - 国・都市選択を `useGeoData` フックに変更

- **`MeetupsView.tsx`**:
  - `CommentsPanel` コンポーネントを統合
  - `getUserByDiscordId` を `utils/users` から取得

- **`CommentsPanel.tsx`**（新規）:
  - コメント表示・投稿・削除機能
  - `CommentsAPI` を使用

**5. 通知機能（`src/utils/notifications.ts`）**

- `getUnreadCount()`, `setUnreadCount()` などをAPI呼び出しに変更
- `NotificationsAPI.getUnreadCount()` を使用
- フォールバックとしてlocalStorageも使用

---

## API仕様

### ベースURL
- 開発: `http://localhost:8000/api`
- 本番: 環境変数 `VITE_API_BASE_URL` で設定

### 認証
- **現状**: 未実装（将来的にDiscord認証を実装予定）
- **現在**: `user_discord_id` をリクエストボディで送信

### エラーレスポンス
```json
{
  "detail": "エラーメッセージ"
}
```

### 主要エンドポイント

詳細は [`src/BACKEND_SPEC.md`](./src/BACKEND_SPEC.md) を参照してください。

---

## データベース構造

### マイグレーション

- `0001_initial.py`: Tripモデル
- `0002_notifications_comments_votes.py`: Notification, Comment, DateProposal, DateVote
- `0003_geo_models.py`: Region, Country, City
- `0004_userprofile.py`: UserProfile

### マイグレーション実行

```bash
cd backend
python manage.py migrate
```

### シードデータ投入

```bash
# 地理マスタ
python manage.py load_geo_seed --clean

# ユーザーマスタ
python manage.py load_users_seed --clean

# 旅行予定（App.tsxから）
python manage.py load_trips_seed --clean --source app
```

---

## デプロイ設定

### ブランチ: `docker-deploy`

#### 実装内容

**1. Docker設定**

- **`docker/backend.Dockerfile`**:
  - ベースイメージ: `python:3.11-slim`
  - UvicornでASGIアプリケーションを起動
  - ポート: 8000

- **`docker/docker-compose.yml`**:
  - **db**: PostgreSQL 15
  - **backend**: Djangoアプリケーション
  - **caddy**: リバースプロキシ（TLS終端）

- **`docker/Caddyfile`**:
  - ドメイン設定
  - バックエンドへのプロキシ設定

**2. デプロイ手順（`DEPLOY_DOCKER.md`）**

1. VPS環境のセットアップ
2. Docker/Docker Composeのインストール
3. リポジトリのクローン
4. `.env` ファイルの作成
5. `docker-compose up -d` で起動
6. マイグレーション実行
7. シードデータ投入

詳細は `docker-deploy` ブランチの `DEPLOY_DOCKER.md` を参照してください。

---

## テスト

### ブランチ: `api-tests`

#### 実装内容

**1. Postmanコレクション（`tests/postman_collection.json`）**

- 全APIエンドポイントのリクエスト例
- 環境変数: `base_url`, `trip_id`, `user_id` など

**2. pytest統合テスト（`tests/test_api_integration.py`）**

- テストクラス:
  - `TestGeoAPI`: 地理データAPI
  - `TestUsersAPI`: ユーザーAPI
  - `TestTripsAPI`: 旅行予定API
  - `TestNotificationsAPI`: 通知API
  - `TestCommentsAPI`: コメントAPI
  - `TestDateProposalsAPI`: 日程候補・投票API

**3. テスト実行**

```bash
cd backend
pip install pytest requests
pytest ../tests/test_api_integration.py -v
```

詳細は `tests/README.md` を参照してください。

---

## 既知の問題と注意事項

### 1. 認証未実装
- 現在は認証機能が未実装
- `user_discord_id` をリクエストボディで送信しているが、将来的にDiscord認証を実装予定
- 認証実装時は、セッション管理やJWTトークンの検討が必要

### 2. データベース
- 開発環境はSQLiteを使用
- 本番環境ではPostgreSQLに移行予定
- 移行時は `settings.py` のデータベース設定を変更

### 3. CORS設定
- フロントエンドドメインを `CORS_ALLOWED_ORIGINS` に追加する必要がある
- 本番環境のドメインを設定すること

### 4. 日付フォーマット
- フロントエンド: `Date` オブジェクト → ISO文字列
- バックエンド: ISO文字列 → `date` オブジェクト
- タイムゾーンの扱いに注意

### 5. 絵文字・地域コード
- `Country.code` が空の可能性がある
- フロントエンドで絵文字を期待している場合、バックエンドで保存する必要がある

### 6. 参加者配列
- `participants` は `string[]` (discord_id) として扱う
- join/leave の重複チェックが必要

### 7. 通知の既読反映
- `mark_read` / `mark_all_read` のタイミング
- `read_at` が正しく設定されるか確認

### 8. 動作確認未完了
- 大量のコード修正を行ったが、動作確認が不十分
- 各機能の動作確認が必要

---

## 次のステップ

### 優先度: 高

1. **動作確認とデバッグ**
   - ローカル環境でバックエンド・フロントエンドを起動
   - 各機能の動作確認
   - エラーの修正

2. **認証機能の実装**
   - Discord認証の実装
   - セッション管理またはJWTトークンの実装

3. **PostgreSQLへの移行**
   - 本番環境用のデータベース設定
   - マイグレーションの確認

### 優先度: 中

4. **本番環境へのデプロイ**
   - VPS環境のセットアップ
   - Docker Composeでのデプロイ
   - ドメイン設定

5. **テストの拡充**
   - 単体テストの追加
   - 統合テストの拡充

6. **パフォーマンス最適化**
   - データベースクエリの最適化
   - キャッシュの実装

### 優先度: 低

7. **機能追加**
   - Discord連携の実装
   - その他の機能追加

---

## ファイル構成

### バックエンド（`drf-persistence` ブランチ）

```
backend/
├── manage.py
├── requirements.txt
├── README.md
├── server/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── api/
    ├── __init__.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    ├── migrations/
    │   ├── 0001_initial.py
    │   ├── 0002_notifications_comments_votes.py
    │   ├── 0003_geo_models.py
    │   └── 0004_userprofile.py
    └── management/
        └── commands/
            ├── load_geo_seed.py
            ├── load_users_seed.py
            └── load_trips_seed.py
```

### フロントエンド（`fe-api-integration` ブランチ）

```
src/
├── App.tsx
├── main.tsx
├── utils/
│   ├── api.ts          # API統合モジュール
│   ├── auth.ts         # 認証（モック）
│   ├── notifications.ts # 通知機能
│   └── users.ts         # ユーザーキャッシュ
├── hooks/
│   └── useGeoData.ts   # 地理データフック
└── components/
    ├── CommentsPanel.tsx # コメントパネル（新規）
    ├── CountryFilter.tsx
    ├── AddTripPage.tsx
    ├── AddMeetupPage.tsx
    ├── CreateRecruitmentDialog.tsx
    ├── MeetupsView.tsx
    └── ...
```

### Docker設定（`docker-deploy` ブランチ）

```
docker/
├── backend.Dockerfile
├── docker-compose.yml
└── Caddyfile
```

### テスト（`api-tests` ブランチ）

```
tests/
├── postman_collection.json
├── test_api_integration.py
└── README.md
```

---

## 環境変数

### フロントエンド

- `VITE_API_BASE_URL`: バックエンドAPIのベースURL（デフォルト: `http://localhost:8000/api`）

### バックエンド

- `DATABASE_URL`: PostgreSQL接続URL（本番環境）
- `SECRET_KEY`: Djangoシークレットキー
- `ALLOWED_HOSTS`: 許可するホスト
- `CORS_ALLOWED_ORIGINS`: CORS許可オリジン

---

## 開発環境セットアップ

### バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_geo_seed --clean
python manage.py load_users_seed --clean
python manage.py load_trips_seed --clean --source app
python manage.py runserver 0.0.0.0:8000
```

### フロントエンド

```bash
npm install
VITE_API_BASE_URL=http://localhost:8000/api npm run dev
```

---

## コミット履歴の確認

各ブランチの主要なコミット:

- **drf-persistence**:
  - `6364ed0`: Django DRFバックエンド初期実装
  - `b8c7d23`: 地理マスタ追加
  - `5ff4bcd`: ユーザーマスタ追加
  - `db6d313`: 旅行予定シードコマンド追加

- **fe-api-integration**:
  - `e6e1b81`: フロントエンドAPI統合
  - `034b1ae`: api.tsのコンフリクト解決

- **docker-deploy**:
  - `36a7a35`: Docker設定追加

- **api-tests**:
  - `96e48f0`: テストコード追加

---

## 連絡先・参考資料

- **リポジトリ**: https://github.com/kazuu234/caldemo
- **ブランチ構成**: [`BRANCHES.md`](./BRANCHES.md)
- **バックエンド仕様**: [`src/BACKEND_SPEC.md`](./src/BACKEND_SPEC.md)
- **デプロイ手順**: `docker-deploy` ブランチの `DEPLOY_DOCKER.md`

---

**このドキュメントは継続的に更新してください。**

