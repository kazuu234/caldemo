# 🚀 クイックデプロイガイド

このガイドは、最短5分でアプリをVercelにデプロイする手順です。

## 📋 チェックリスト

デプロイ前に以下を準備してください：

- [ ] GitHubアカウント（無料）
- [ ] Vercelアカウント（無料・GitHubでサインアップ可能）
- [ ] このプロジェクトのファイル一式

## ⚡ 5分でデプロイ

### ステップ1: GitHubリポジトリを作成（2分）

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名を入力（例: `travel-community-app`）
4. 「Public」を選択（無料でデプロイするため）
5. 「Create repository」をクリック

### ステップ2: コードをGitHubにプッシュ（1分）

ターミナルまたはコマンドプロンプトで以下を実行：

```bash
# プロジェクトフォルダに移動
cd /path/to/your/project

# Gitリポジトリを初期化
git init

# すべてのファイルをステージング
git add .

# コミット
git commit -m "Initial commit"

# GitHubリポジトリを追加（YOUR_USERNAMEとYOUR_REPO_NAMEを変更）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# プッシュ
git branch -M main
git push -u origin main
```

**💡 Tip**: GitHubのリポジトリページに表示されるコマンドをコピー＆ペーストできます。

### ステップ3: Vercelにデプロイ（2分）

1. [Vercel](https://vercel.com)にアクセス
2. 「Continue with GitHub」でログイン
3. 「Import Project」または「Add New...」→「Project」をクリック
4. GitHubリポジトリを検索して選択
5. 設定を確認（通常はデフォルトでOK）：
   - Framework: **Vite** （自動検出されます）
   - Root Directory: `./`
   - Build Command: 自動設定
   - Output Directory: 自動設定
6. 「Deploy」をクリック

### ステップ4: デプロイ完了！

🎉 デプロイが完了すると、以下のようなURLが発行されます：

```
https://your-repo-name.vercel.app
```

このURLを友達に共有すれば、誰でもアプリにアクセスできます！

## 📱 アプリにアクセスする

デプロイ完了後：

1. Vercelが発行したURLにアクセス
2. ブラウザでアプリが起動
3. LocalStorageを使用しているため、各ユーザーのデータは独立して保存されます

## ⚠️ 重要な注意事項

### LocalStorageの制限

現在のバージョンはLocalStorageを使用しているため：

- ✅ 各ユーザーが自分のブラウザでアプリを使用可能
- ❌ **ユーザー間でデータは共有されません**
- ❌ Aさんの旅行予定をBさんは見られません
- ❌ ブラウザのキャッシュをクリアするとデータが消えます

### データ共有が必要な場合

真のコミュニティアプリとして使用する場合は、Supabaseバックエンドの実装が必要です。
詳細は[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)の「オプション2」を参照してください。

## 🔧 カスタムドメインの設定（オプション）

Vercelでカスタムドメインを使用できます（無料）：

1. Vercelプロジェクトの「Settings」→「Domains」
2. ドメイン名を入力（例: `travel.yourdomain.com`）
3. DNSレコードを設定（指示に従う）

## 🔄 更新のデプロイ

コードを更新した場合：

```bash
# 変更をコミット
git add .
git commit -m "Update: 説明を記載"

# GitHubにプッシュ
git push
```

Vercelが自動的に検知して再デプロイします（通常1-2分）。

## 📊 デプロイ状態の確認

Vercelダッシュボードで以下を確認できます：

- ✅ デプロイの成功/失敗
- 📈 アクセス統計
- 🐛 エラーログ
- 🌍 地域別のパフォーマンス

## 🆘 トラブルシューティング

### ビルドエラーが出る場合

**エラー例**: `command not found: vite`

**解決方法**: Vercelの設定を確認
1. プロジェクト設定→「Build & Development Settings」
2. Framework Presetが「Vite」になっているか確認
3. Build Commandを手動で設定: `npm run build`

### ページが真っ白になる場合

**原因**: ルーティングの問題

**解決方法**: `vercel.json`を作成（すでに作成済み）

### 環境変数が必要な場合

1. Vercelプロジェクト→「Settings」→「Environment Variables」
2. 変数名と値を入力
3. 「Save」→再デプロイ

## 💡 次のステップ

### すぐにできること
- [ ] URLを友達に共有してフィードバックをもらう
- [ ] カスタムドメインを設定
- [ ] Discord認証を設定

### 本格運用に向けて
- [ ] Supabaseバックエンドの実装
- [ ] ユーザー間でのデータ共有を実現
- [ ] リアルタイム通知機能

詳細は[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)を参照してください。

## 📞 サポート

質問やエラーがある場合：

1. [Vercelのドキュメント](https://vercel.com/docs)を確認
2. GitHubでIssueを作成
3. Vercelのコミュニティフォーラムで質問

---

**これであなたのアプリは世界中からアクセス可能になりました！🌍**
