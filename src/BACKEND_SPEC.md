# バックエンド仕様書（Django REST Framework実装用）

このドキュメントは、Figma Makeで作成したフロントエンドコードを参照しながら、Django REST Frameworkバックエンドを実装するためのガイドです。

## 概要

海外旅行のコミュニティアプリで、ユーザーが旅行予定を共有し、現地で合流できる機能を提供します。
Discord認証を利用し、特定のDiscordサーバーのメンバー限定でアクセスできます。

現在フロントエンドは**localStorage**でデータ管理していますが、これを**Django REST Framework**のAPIに移行します。

## フロントエンドの現状（localStorage箇所）

### 1. 認証情報の保存：`utils/auth.ts`

**localStorage使用箇所:**
- `AUTH_STORAGE_KEY = 'travel_app_auth_user'`
- `getAuthUser()`: localStorageから認証ユーザー取得
- `setAuthUser(user)`: localStorageに認証ユーザー保存
- `clearAuthUser()`: localStorageから認証情報削除

**モック関数（実APIに置き換える必要あり）:**
- `searchDiscordUsers(query)`: Discordユーザー検索（前方一致）
- `searchDiscordUsersByDisplayName(query)`: Display Name検索（部分一致）
- `requestDiscordAuth(discordId)`: Discord DMリクエスト送信
- `verifyAuthToken(token)`: ワンタイムトークン検証

### 2. 旅行予定データ：`App.tsx`

**現在の実装:**
```typescript
// 行61-180: initialTrips（モックデータ）
const initialTrips: Trip[] = [ /* ... */ ];

// 行185: ステート管理
const [trips, setTrips] = useState<Trip[]>(initialTrips);
```

現在はコンポーネント内でステート管理しているだけで、永続化されていません（リロードでリセット）。

**CRUD操作の実装箇所:**
- 作成: `AddTripPage.tsx` の `handleSubmit()`
- 更新: `EditTripDialog.tsx` の `handleSubmit()`
- 削除: `EditTripDialog.tsx` の `handleDelete()`
- 一覧: `App.tsx` の `trips` ステート

### 3. 通知データ：`utils/notifications.ts`

**localStorage使用箇所:**
- `UNREAD_COUNT_KEY = 'travel_app_unread_count'`
- `NOTIFIED_TRIPS_KEY = 'travel_app_notified_trips'`
- `getUnreadCount()`, `setUnreadCount()`, `clearUnreadCount()`

## データ型定義（TypeScript → バックエンド対応）

### AuthUser（認証ユーザー）

**フロントエンド型:** `utils/auth.ts` 4-12行目
```typescript
export interface AuthUser {
  id: string;
  username: string;        // Discord アカウント名（半角英数字3-20文字）
  displayName: string;     // 表示名（日本語名など）
  discordId: string;
  discordTag: string;      // username#1234
  avatar: string;          // アバターURL
  authenticatedAt: Date;
}
```

### Trip（旅行予定）

**フロントエンド型:** `App.tsx` 42-59行目
```typescript
export interface Trip {
  id: string;
  userName: string;              // 投稿ユーザーの表示名
  userAvatar: string;            // 投稿ユーザーのアバター
  country: string;
  city: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  isOwn?: boolean;               // 自分の予定かどうか（フロントで計算）
  isRecruitment?: boolean;       // 合流募集
  recruitmentDetails?: string;   // 募集内容
  discordLinked?: boolean;       // Discord連携済み
  isHidden?: boolean;            // みんなの予定に非表示
  minParticipants?: number;      // 最小募集人数
  maxParticipants?: number;      // 最大募集人数
  participants?: Participant[];  // 参加者リスト
}
```

### Participant（参加者）

**フロントエンド型:** `App.tsx` 35-40行目
```typescript
export interface Participant {
  username: string;      // Discord アカウント名
  displayName: string;   // 表示名
  avatar: string;        // アバターURL
  discordId: string;
}
```

## 必要なAPIエンドポイント

以下のモック関数を実APIに置き換える必要があります。

### 認証API（`utils/auth.ts`参照）

#### 1. Discord ユーザー検索（前方一致）
**現在:** `searchDiscordUsers(query)` - 56-201行目（モック）

```
POST /api/auth/search-users/
Content-Type: application/json

Request:
{
  "query": "tanaka"  // 3-20文字の半角英数字
}

Response:
{
  "users": [
    {
      "discordId": "123456789012345678",
      "username": "tanaka",
      "displayName": "田中太郎",
      "discriminator": "1234"
    }
  ]
}
```

**要件:**
- 特定のDiscordサーバーのメンバーのみ検索
- usernameで前方一致
- Discord Bot APIを使用

#### 2. Discord ユーザー検索（Display Name・部分一致）
**現在:** `searchDiscordUsersByDisplayName(query)` - 207-371行目（モック）

```
POST /api/auth/search-users-by-displayname/
Content-Type: application/json

Request:
{
  "query": "田中"  // 1文字以上
}

Response:
{
  "users": [
    {
      "discordId": "123456789012345678",
      "username": "tanaka",
      "displayName": "田中太郎",
      "discriminator": "1234",
      "avatar": "https://cdn.discordapp.com/avatars/..."
    }
  ]
}
```

#### 3. Discord DM認証リクエスト
**現在:** `requestDiscordAuth(discordId)` - 377-388行目（モック）

```
POST /api/auth/request-dm/
Content-Type: application/json

Request:
{
  "discordId": "123456789012345678"
}

Response:
{
  "success": true,
  "message": "DMを送信しました。Discordをご確認ください。"
}
```

**要件:**
- ワンタイムトークン生成（64文字、15分間有効）
- Discord BotでDM送信
- DM内容: 認証URL（`https://your-app.com/?auth_token=XXXXX`）

#### 4. トークン検証・認証完了
**現在:** `verifyAuthToken(token)` - 394-425行目（モック）

```
POST /api/auth/verify-token/
Content-Type: application/json

Request:
{
  "token": "XXXXXXXXXXXX..."
}

Response (成功):
{
  "success": true,
  "user": {
    "id": "1",
    "username": "tanaka",
    "displayName": "田中太郎",
    "discordId": "123456789012345678",
    "discordTag": "tanaka#1234",
    "avatar": "https://cdn.discordapp.com/avatars/...",
    "authenticatedAt": "2025-10-30T12:00:00Z"
  }
}

Response (失敗):
{
  "success": false,
  "error": "無効なトークンです"
}
```

**要件:**
- トークンの有効性チェック（存在、未使用、有効期限）
- User作成または取得
- Session作成（Django SessionまたはJWT）

#### 5. ログアウト
**現在:** フロントエンドで`clearAuthUser()`を呼ぶだけ

```
POST /api/auth/logout/

Response:
{
  "success": true
}
```

### 旅行予定API

#### 1. 旅行予定一覧取得
**現在:** `App.tsx` 行185 `trips` ステート

```
GET /api/trips/?countries=タイ,日本&view=everyone

Response:
{
  "trips": [
    {
      "id": "uuid-here",
      "userName": "田中太郎",
      "userAvatar": "https://...",
      "country": "日本",
      "city": "東京",
      "startDate": "2025-11-05",
      "endDate": "2025-11-10",
      "description": "紅葉シーズンの京都観光",
      "isOwn": true,  // currentUser.id === trip.user.id
      "isRecruitment": false,
      "isHidden": false,
      "participants": []
    }
  ]
}
```

**Query Parameters:**
- `countries`: カンマ区切りの国名（オプション）
- `view`: `everyone` | `mine` | `recruitments`

#### 2. 旅行予定作成
**現在:** `AddTripPage.tsx` 行151-243 `handleSubmit()`

```
POST /api/trips/
Content-Type: application/json

Request:
{
  "country": "日本",
  "city": "東京",
  "startDate": "2025-11-05",
  "endDate": "2025-11-10",
  "description": "紅葉シーズンの京都観光",
  "isRecruitment": false,
  "recruitmentDetails": "",
  "isHidden": false,
  "minParticipants": null,
  "maxParticipants": null
}

Response:
{
  "success": true,
  "trip": { /* Trip object */ }
}
```

#### 3. 旅行予定更新
**現在:** `EditTripDialog.tsx` 行150-237 `handleSubmit()`

```
PUT /api/trips/{id}/
Content-Type: application/json

Request: （作成と同じフォーマット）

Response:
{
  "success": true,
  "trip": { /* Trip object */ }
}
```

#### 4. 旅行予定削除
**現在:** `EditTripDialog.tsx` 行239-261 `handleDelete()`

```
DELETE /api/trips/{id}/

Response:
{
  "success": true
}
```

#### 5. 募集への参加
**現在:** `CreateRecruitmentDialog.tsx` 行132-164 `handleJoin()`

```
POST /api/trips/{id}/join/

Response:
{
  "success": true,
  "participant": {
    "username": "tanaka",
    "displayName": "田中太郎",
    "avatar": "https://...",
    "discordId": "123456789012345678"
  }
}
```

#### 6. 募集から退出
**現在:** `CreateRecruitmentDialog.tsx` 行166-188 `handleLeave()`

```
POST /api/trips/{id}/leave/

Response:
{
  "success": true
}
```

## Discord認証フロー

**フロントエンド実装:** `components/DiscordAuthDialog.tsx`

1. **ユーザー検索** (行72-96)
   - ユーザーがDiscordアカウント名を入力
   - `searchDiscordUsers(query)` → API呼び出しに置き換え

2. **DM送信リクエスト** (行98-117)
   - ユーザーが候補から選択
   - `requestDiscordAuth(discordId)` → API呼び出しに置き換え
   - バックエンドがワンタイムトークン生成してDiscord Botで送信

3. **認証完了** (`App.tsx` 行204-233)
   - URLパラメータ `?auth_token=XXX` を検出
   - `verifyAuthToken(token)` → API呼び出しに置き換え
   - 成功したら`setAuthUser(user)`でlocalStorageに保存 → Session管理に置き換え

4. **自動ログイン** (`App.tsx` 行226-230)
   - ページ読み込み時に`getAuthUser()`でlocalStorageチェック → Session/JWTチェックに置き換え

## フロントエンド修正ポイント

### 1. `utils/auth.ts` のモック関数を実API呼び出しに置き換え

```typescript
// Before (モック)
export async function searchDiscordUsers(query: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUsers.filter(...);
}

// After (実API)
export async function searchDiscordUsers(query: string) {
  const response = await fetch('/api/auth/search-users/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return (await response.json()).users;
}
```

### 2. `App.tsx` のtrips管理をlocalStorageからAPIに移行

```typescript
// Before
const [trips, setTrips] = useState<Trip[]>(initialTrips);

// After
const [trips, setTrips] = useState<Trip[]>([]);

useEffect(() => {
  if (authUser) {
    fetchTrips();
  }
}, [authUser, selectedFilters, activeView]);

async function fetchTrips() {
  const params = new URLSearchParams();
  if (selectedFilters.length > 0) {
    params.append('countries', selectedFilters.map(f => f.name).join(','));
  }
  params.append('view', activeView);
  
  const response = await fetch(`/api/trips/?${params}`, {
    credentials: 'include', // Cookie送信（Django session使用時）
  });
  const data = await response.json();
  setTrips(data.trips);
}
```

### 3. `AddTripPage.tsx`, `EditTripDialog.tsx` のCRUD処理をAPI呼び出しに

```typescript
// 作成
const response = await fetch('/api/trips/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(newTrip),
});

// 更新
const response = await fetch(`/api/trips/${trip.id}/`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(updatedTrip),
});

// 削除
const response = await fetch(`/api/trips/${trip.id}/`, {
  method: 'DELETE',
  credentials: 'include',
});
```

## セキュリティ・認証

### CORSの設定が必要
- フロントエンド: `http://localhost:5173` (開発)
- 本番: 適切なドメイン
- `credentials: 'include'` を使うため `CORS_ALLOW_CREDENTIALS = True`

### 認証方式（2つのオプション）

**Option 1: Django Session（推奨・シンプル）**
- Cookie自動送信
- CSRFトークン必要

**Option 2: JWT**
- `Authorization: Bearer {token}` ヘッダー
- localStorage/sessionStorageでトークン管理

### Discord Bot要件
- 特定サーバーのメンバー取得権限
- DM送信権限
- 環境変数: `DISCORD_BOT_TOKEN`, `DISCORD_SERVER_ID`

## 国・地域データ

**フロントエンド:** `components/countries-data.ts`

195の国と地域データが定義されています。バックエンド側でも同じデータが必要な場合は、このファイルを参照してください。

## 通知機能（将来的な拡張）

**現在:** フロントエンドのみ（`utils/notifications.ts`）
- HTML5 Notification API
- Badging API
- localStorage管理

**将来的には:**
- バックエンドからWebPush通知
- Discord Bot経由での通知

## 開発の進め方

1. **このフロントエンドコード全体をCursorにインポート**
2. **このBACKEND_SPEC.mdを参照**しながらDjangoプロジェクト作成
3. **フロントエンドの型定義を見ながら**Djangoモデル作成
4. **モック関数の処理を見ながら**API実装
5. **フロントエンド修正**（localStorage → API呼び出し）
6. **統合テスト**

---

**重要:** フロントエンドの実装が仕様書です。コード内のコメントや型定義、モック関数の処理をよく読んで、それに合わせてバックエンドを実装してください。
