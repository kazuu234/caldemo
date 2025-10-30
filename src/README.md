# 海外旅行コミュニティアプリ

海外旅行の予定を共有し、現地で合流したり、オフ会を開催できるコミュニティアプリです。

## 🌟 主な機能

### 旅行予定管理
- 📅 カレンダービューで視覚的に予定を確認
- 📋 リストビューで詳細情報を一覧表示
- 🌍 国・地域別のフィルター機能
- ✏️ 自分の予定の編集・削除

### 合流募集
- 🤝 旅行先で合流できる仲間を募集
- 👥 参加者管理機能
- 💬 募集内容の詳細説明

### オフ会管理
- 🎉 日本国内・海外でのオフ会開催
- 📊 日程未定の場合は候補日投票機能
- 👨‍👩‍👧‍👦 参加者の管理

### その他
- 🔔 通知システム（HTML5通知API + Badging API）
- 💬 Discord連携
- 📱 モバイル対応

## ⚠️ 重要な制限事項（現在のバージョン）

**このアプリは現在LocalStorageを使用しています。**

これは以下を意味します：
- ✅ 各ユーザーが自分のブラウザで旅行予定を管理できる
- ❌ **ユーザー間でデータは共有されません**
- ❌ 異なるデバイスやブラウザではデータは見えません
- ❌ ブラウザのデータをクリアするとすべてのデータが消えます

**真のコミュニティアプリとして使用する場合は、Supabaseバックエンドの実装が必要です。**
詳細は[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)の「オプション2」をご覧ください。

## 🚀 デプロイ手順（Vercel）

### 前提条件
- GitHubアカウント
- Vercelアカウント（無料）

### ステップ1: GitHubリポジトリの作成

1. [GitHub](https://github.com)で新規リポジトリを作成
2. ローカルでGitリポジトリを初期化：

```bash
git init
git add .
git commit -m "Initial commit: Travel community app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### ステップ2: Vercelにデプロイ

1. [Vercel](https://vercel.com)にアクセス
2. GitHubアカウントでログイン
3. 「Import Project」または「Add New」→「Project」をクリック
4. GitHubリポジトリを選択
5. プロジェクト設定:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` または `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. 「Deploy」をクリック

### ステップ3: デプロイ完了

数分後、以下のようなURLが発行されます：
```
https://your-app-name.vercel.app
```

このURLを共有すれば、誰でもアプリにアクセスできます。

## 🌐 Netlifyへのデプロイ（代替方法）

### 手順

1. [Netlify](https://netlify.com)にアクセス
2. GitHubアカウントでログイン
3. 「Add new site」→「Import an existing project」
4. GitHubリポジトリを選択
5. Build settings:
   - **Build command**: `npm run build` または `vite build`
   - **Publish directory**: `dist`
6. 「Deploy site」をクリック

## 🔧 ローカル開発

Figma Make環境で開発する場合は、そのまま編集できます。

ローカル環境で開発する場合：

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview
```

## 📱 PWA機能

このアプリはPWA（Progressive Web App）として動作します：
- オフライン対応
- ホーム画面に追加可能
- アプリライクな体験

詳細は[PWA_SETUP.md](./PWA_SETUP.md)をご覧ください。

## 📚 ドキュメント

- [デプロイメントガイド](./DEPLOYMENT_GUIDE.md) - LocalStorage版とSupabase版の詳細
- [バックエンド仕様](./BACKEND_SPEC.md) - Supabase実装の仕様
- [フロントエンドセットアップ](./FRONTEND_SETUP.md) - 技術スタック
- [ユーザーガイド](./USER_GUIDE.md) - 使い方
- [PWAセットアップ](./PWA_SETUP.md) - PWA機能の詳細

## 🔐 Discord認証

Discord認証を有効にする場合：

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリケーションを作成
2. OAuth2のリダイレクトURLを設定：
   ```
   https://your-app-name.vercel.app/
   ```
3. Client IDをアプリに設定

## ⚡ 次のステップ

### 現在の状態（LocalStorage版）
- ✅ デモやプロトタイプとして使用
- ✅ 個人の旅行予定管理ツールとして使用
- ✅ UIデザインの確認

### 本格運用に向けて（Supabase版）
真のコミュニティアプリとして運用する場合：
1. Supabaseプロジェクトを作成
2. データベーススキーマを設定
3. フロントエンドをSupabase対応に移行
4. 再デプロイ

詳細な手順は[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)の「オプション2」を参照してください。

## 🤝 貢献

イシューやプルリクエストを歓迎します！

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 クレジット

- UI Components: shadcn/ui
- Icons: Lucide React
- Framework: React + Vite
- Styling: Tailwind CSS
- Deployment: Vercel

詳細は[Attributions.md](./Attributions.md)をご覧ください。

---

**質問や問題がある場合は、Issueを作成してください。**
