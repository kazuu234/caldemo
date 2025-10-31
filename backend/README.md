# Backend (Django + DRF)

このディレクトリは Django REST Framework バックエンドです。開発では SQLite、将来的に PostgreSQL を予定しています。

## セットアップ（ローカル）

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

- 管理画面: http://localhost:8000/admin/
- API ルート: http://localhost:8000/api/

## エンドポイント

### Trips
- `GET /api/trips/` 一覧（検索/フィルタ/並び替え）
- `POST /api/trips/` 作成
- `GET /api/trips/{id}/` 取得
- `PUT/PATCH /api/trips/{id}/` 更新
- `DELETE /api/trips/{id}/` 削除
- `POST /api/trips/{id}/join` 参加（body: `{ "discord_id": "..." }`）
- `POST /api/trips/{id}/leave` 退出（body: `{ "discord_id": "..." }`）
- `POST /api/trips/{id}/toggle_recruitment` 募集ON/OFF
- `POST /api/trips/{id}/end_recruitment` 募集終了
- `POST /api/trips/{id}/toggle_hidden` 非表示ON/OFF

### Notifications（通知履歴/未読管理）
- `GET /api/notifications/?user_discord_id=...&unread_only=true` 通知一覧（未読のみ可）
- `GET /api/notifications/count?user_discord_id=...` 通知総数/未読数
- `POST /api/notifications/{id}/mark_read` 単体既読
- `POST /api/notifications/mark_all_read` body: `{ "user_discord_id": "..." }` まとめて既読

### Comments（コメント）
- `GET /api/comments/?trip={trip_id}` 一覧
- `POST /api/comments/` 作成（`trip`, `user_discord_id`, `user_name`, `content`）
- `GET /api/comments/{id}/` 取得
- `PUT/PATCH /api/comments/{id}/` 更新
- `DELETE /api/comments/{id}/` 削除

### Date Proposals & Votes（日程候補/投票）
- `GET /api/date_proposals/?trip={trip_id}` 候補一覧（`votes_count` 含む）
- `POST /api/date_proposals/` 追加（`trip`, `date`, `created_by_discord_id`）
- `GET /api/date_proposals/{id}/` 取得
- `DELETE /api/date_proposals/{id}/` 削除
- `GET /api/date_proposals/{id}/votes` 票一覧
- `POST /api/date_proposals/{id}/vote` 投票（body: `{ "user_discord_id": "..." }`）
- `POST /api/date_proposals/{id}/unvote` 取消（body: `{ "user_discord_id": "..." }`）

## エンドポイント（追加）

### Geo（地域・国・都市）
- `GET /api/regions/` 地域一覧（検索: `search=`、並び替え: `ordering=`）
- `GET /api/countries/?region={region_id}&region_code=ASIA` 国一覧（地域でフィルタ可）
- `GET /api/cities/?country={country_id}&country_code=JP&region_code=ASIA` 都市一覧（国/地域でフィルタ可）

## データ投入（フロントTSデモデータから）

以下のフロントエンドのTSファイルを解析して、DBに地域・国・都市を投入します。
- `src/components/countries-data.ts`（`COUNTRIES_BY_REGION` を想定）
- `src/components/japan-cities-data.ts`（`JAPAN_CITIES` を想定）

コマンド:
```bash
cd backend
python manage.py migrate
python manage.py load_geo_seed --clean
```
- `--clean`: 既存の地域/国/都市データを削除してから再投入します。
- 取り込みルール（ざっくり）:
  - 地域: 内部でコードを定義（例: 日本=JAPAN, アジア=ASIA など）
  - 国: `COUNTRIES_BY_REGION` の各地域に紐づく `name` を登録
  - 都市: `JAPAN_CITIES` の `cities` 配列を日本の都市として登録

注意:
- TSファイルの構造が大きく変わっている場合、正規表現による簡易パーサが取りこぼす可能性があります。その場合は構造に合わせて `load_geo_seed.py` の正規表現を調整してください。

## モデル概要
- `Trip`: 旅行/オフ会、募集、参加者、非表示など
- `Notification`: ユーザー別の通知履歴（既読/未読）
- `Comment`: トリップに紐づくコメント
- `DateProposal`: トリップに紐づく日程候補
- `DateVote`: 候補に対するユーザー投票

## 設定
- DB: SQLite（`server/settings.py`）
- CORS: 開発中は `CORS_ALLOW_ALL_ORIGINS = True`
- 認可: 開発用に `AllowAny`
