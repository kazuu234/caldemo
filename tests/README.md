# API テストガイド

フロントエンド仕様に基づくバックエンドAPIの単体テストです。

## Postman コレクション

### インポート方法
1. Postman を開く
2. Import → File → `tests/postman_collection.json` を選択
3. 環境変数 `base_url` を設定（デフォルト: `http://localhost:8000/api`）

### 使用方法
- 各リクエストを実行してレスポンスを確認
- 変数（`{{trip_id}}`, `{{user_id}}` など）は、先に取得したIDを手動設定
- 環境変数 `base_url` を本番URLに変更してテスト可能

### テスト項目
- Geo APIs: 地域/国/都市の取得
- Users APIs: ユーザー一覧/検索/取得
- Trips APIs: CRUD + join/leave/toggle系
- Notifications APIs: 通知一覧/カウント/既読化
- Comments APIs: CRUD
- Date Proposals & Votes APIs: 候補日作成/投票/取消

## pytest 統合テスト

### セットアップ
```bash
cd backend
pip install pytest pytest-django requests
```

### 実行
```bash
# 全テスト
pytest ../tests/test_api_integration.py -v

# 特定クラスのみ
pytest ../tests/test_api_integration.py::TestTripsAPI -v

# 環境変数でAPI URLを変更
API_BASE_URL=http://localhost:8000/api pytest ../tests/test_api_integration.py -v
```

### 前提条件
- バックエンドサーバーが起動している（`python manage.py runserver`）
- データシード済み（ユーザー/地理マスタ）が推奨

### 注意
- `trip_id` フィクスチャはテスト用Tripを作成し、テスト後に自動削除
- 各テストは独立して実行可能（依存関係は最小限）

## 想定されるバグチェックポイント

### 1. 日付フォーマット
- フロント: `Date` オブジェクト → ISO文字列変換
- バックエンド: ISO文字列 → `date` オブジェクト
- 確認: タイムゾーンやフォーマットの不整合

### 2. CORS
- フロントドメインが許可されているか
- `credentials: 'include'` 使用時の `CORS_ALLOW_CREDENTIALS` 設定

### 3. 絵文字/地域コード
- APIに絵文字が未保存だが、フロントが期待している可能性
- `Country.code` が空の可能性

### 4. 参加者配列
- `participants` が `string[]` (discord_id) であること
- join/leave の重複チェック

### 5. 通知の既読反映
- `mark_read` / `mark_all_read` のタイミング
- `read_at` が正しく設定されるか

