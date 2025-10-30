# フロントエンドセットアップガイド

Figma Makeで作成された海外旅行コミュニティアプリのフロントエンド開発環境セットアップ手順です。

## 技術スタック

- **フレームワーク**: React 18+ with TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS v4.0
- **UIコンポーネント**: shadcn/ui
- **状態管理**: React Hooks (useState, useEffect)
- **ルーティング**: React Router v6
- **アイコン**: lucide-react
- **日付処理**: date-fns
- **通知**: sonner (Toast), HTML5 Notification API
- **PWA機能**: Badging API

## 前提条件

以下がインストールされていることを確認してください：

- **Node.js**: v18.0.0 以上（推奨: v20.x）
- **npm**: v9.0.0 以上（または yarn, pnpm）

```bash
# バージョン確認
node -v
npm -v
```

## セットアップ手順

### 1. プロジェクトのダウンロード

Figma Makeから「Download」でプロジェクトをエクスポートし、任意のディレクトリに展開します。

```bash
cd /path/to/travel-community-app
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが起動したら、ブラ���ザで以下にアクセス：
```
http://localhost:5173
```

### 4. ビルド（本番環境用）

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### 5. ビルドのプレビュー

```bash
npm run preview
```

## プロジェクト構造

```
/
├── App.tsx                    # メインアプリケーションコンポーネント
├── components/                # Reactコンポーネント
│   ├── AddTripPage.tsx       # 旅行予定追加画面
│   ├── CalendarView.tsx      # カレンダービュー
│   ├── ListView.tsx          # リストビュー
│   ├── DiscordAuthDialog.tsx # Discord認証ダイアログ
│   ├── countries-data.ts     # 国・地域データ（195件）
│   └── ui/                   # shadcn/uiコンポーネント
├── utils/                     # ユーティリティ関数
│   ├── auth.ts               # 認証関連（モック関数含む）
│   └── notifications.ts      # 通知機能
├── styles/
│   └── globals.css           # Tailwind CSS & カスタムスタイル
└── public/
    └── manifest.json         # PWA マニフェスト
```

## 主要コンポーネントの説明

### `App.tsx`
- メインコンポーネント
- ルーティング設定
- 認証状態管��
- 旅行予定データ管理（現在はlocalStorageではなくステートのみ）
- **重要**: 行61-180にモックデータ `initialTrips` があります

### `utils/auth.ts`
認証関連のモック関数群。**Django APIへの移行が必要な箇所**：

- `searchDiscordUsers()` - 56-201行目
- `searchDiscordUsersByDisplayName()` - 207-371行目
- `requestDiscordAuth()` - 377-388行目
- `verifyAuthToken()` - 394-425行目

### `utils/notifications.ts`
- HTML5 Notification API
- Badging API（PWA）
- localStorage管理（未読カウント）

### `components/countries-data.ts`
- 195の国・地域データ
- 国旗絵文字付き
- フィルター機能で使用

## 現在の状態（localStorage使用箇所）

### 1. 認証情報
**ファイル**: `utils/auth.ts`  
**キー**: `travel_app_auth_user`

```typescript
// 保存
setAuthUser(user);

// 取得
const user = getAuthUser();

// 削除（ログアウト）
clearAuthUser();
```

### 2. 通知データ
**ファイル**: `utils/notifications.ts`  
**キー**: 
- `travel_app_unread_count`
- `travel_app_notified_trips`

### 3. 旅行予定データ
**現在**: ステート管理のみ（永続化なし）  
**ファイル**: `App.tsx` 行185

```typescript
const [trips, setTrips] = useState<Trip[]>(initialTrips);
```

## Django APIとの統合準備

### 環境変数の設定（���奨）

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Viteプロキシ設定（CORS回避・開発用）

`vite.config.ts` を作成（存在しない場合）：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### API呼び出し例

`utils/auth.ts` のモック関数を実API呼び出しに置き換え：

```typescript
// Before (モック)
export async function searchDiscordUsers(query: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUsers.filter(...);
}

// After (実API)
export async function searchDiscordUsers(query: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${baseUrl}/api/auth/search-users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Cookie送信（Django session使用時）
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  const data = await response.json();
  return data.users;
}
```

## PWA機能（オプショ���）

### Service Worker登録

PWA機能を有効にする場合は、`main.tsx` または `App.tsx` に以下を追加：

```typescript
// Service Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
  });
}
```

### 通知許可リクエスト

既に実装済み（`utils/notifications.ts`）：

```typescript
import { requestNotificationPermission } from './utils/notifications';

// アプリ起動時など
requestNotificationPermission();
```

## 開発時のTips

### 1. モックデータの変更

`App.tsx` の `initialTrips` を編集してテストデータを変更できます。

### 2. 認証状態のテスト

Chrome DevTools → Application → Local Storage で `travel_app_auth_user` を確認・編集できます。

### 3. ホットリロード

Viteは自動的にホットリロードします。コード変更は即座に反映されます。

### 4. TypeScriptエラーチェック

```bash
npm run type-check  # package.jsonに設定が必要
# または
npx tsc --noEmit
```

### 5. Linting（ESLintが設定されている場合）

```bash
npm run lint
```

## トラブルシューティング

### `npm install` が失敗する

```bash
# node_modules と package-lock.json を削除して再試行
rm -rf node_modules package-lock.json
npm install
```

### ポート5173が使用中

```bash
# vite.config.ts で別ポートを指定
export default defineConfig({
  server: {
    port: 3000,
  }
})
```

### Tailwind CSSが適用されない

`styles/globals.css` が正しくインポートされているか確認：

```typescript
// main.tsx または App.tsx
import './styles/globals.css';
```

## 次のステップ

1. **バックエンド開発**: `BACKEND_SPEC.md` を参照してDjango REST Framework API実装
2. **API統合**: `utils/auth.ts` のモック関数を実API呼び出しに置き換え
3. **trips管理**: `App.tsx` のステート管理をAPI連携に変更
4. **認証フロー**: localStorageベースからSession/JWT管理に移行
5. **デプロイ**: Vercel, Netlify等にデプロイ

詳細は `BACKEND_SPEC.md` を参照してください。

## 関連ドキュメント

- `BACKEND_SPEC.md` - バックエンドAPI仕様
- `PWA_SETUP.md` - PWA機能詳細
- `AUTH_TEST_SCENARIOS.md` - 認証テストシナリオ
- `guidelines/Guidelines.md` - コーディングガイドライン

## サポート

質問や問題がある場合は、各ファイルのコメントを参照してください。特に：

- 型定義: `App.tsx` 行35-59
- モック関数: `utils/auth.ts`
- 国データ: `components/countries-data.ts`
