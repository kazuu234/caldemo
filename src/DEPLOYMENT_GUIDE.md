# デプロイメントガイド

## 現状の理解

現在のアプリケーションは **LocalStorage** を使用してデータを保存しています。LocalStorageの特性として：

- ✅ ブラウザごとに独立したストレージ
- ❌ 異なるユーザー間でデータを共有できない
- ❌ デバイスを変えるとデータが見えない

つまり、現在のままサーバーにデプロイしても、**各ユーザーは自分のブラウザ内でのみデータを管理できる**状態になります。

## 選択肢

### オプション1: LocalStorageのままデプロイ（簡単・データ共有なし）

**メリット:**
- バックエンド不要で簡単
- サーバーコスト最小限
- すぐにデプロイ可能

**デメリット:**
- ユーザー間でデータを共有できない
- 各自が自分の旅行予定のみを管理
- オフ会や合流募集の機能が本来の目的を果たせない

**推奨度:** ⚠️ デモや個人利用のみに適している

### オプション2: Supabaseを使ってデータ共有を実現（推奨）

**メリット:**
- ユーザー間でリアルタイムにデータ共有
- 旅行予定、合流募集、オフ会が本来の目的を果たせる
- Discord認証も正しく機能
- 無料枠で十分運用可能

**デメリット:**
- 初期設定に多少の時間が必要
- バックエンドの知識が少し必要

**推奨度:** ✅ コミュニティアプリとして本格運用する場合に最適

---

## オプション1の手順: LocalStorageのままデプロイ

### 1. Vercelへのデプロイ（最も簡単）

#### 前提条件
- GitHubアカウント
- Vercelアカウント（GitHubで無料登録可能）

#### 手順

**ステップ1: GitHubリポジトリの作成**

```bash
# プロジェクトフォルダで実行
git init
git add .
git commit -m "Initial commit"

# GitHubで新規リポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**ステップ2: Vercelにデプロイ**

1. [Vercel](https://vercel.com)にアクセス
2. 「Import Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 「Deploy」をクリック

**ステップ3: デプロイ完了**

数分後、`https://your-app-name.vercel.app` のようなURLが発行されます。

#### 注意事項
- このURLを共有すれば誰でもアプリにアクセス可能
- ただし、各ユーザーのデータは共有されません
- Discord認証は機能しますが、各ユーザーが独立して使用

### 2. Netlifyへのデプロイ

#### 手順

1. [Netlify](https://netlify.com)にアクセス
2. 「Add new site」→「Import an existing project」
3. GitHubリポジトリを選択
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 「Deploy site」をクリック

---

## オプション2の手順: Supabaseでデータ共有を実装

このアプリは既に`BACKEND_SPEC.md`にバックエンド仕様が定義されており、Supabase対応の準備ができています。

### フェーズ1: Supabaseプロジェクトのセットアップ

#### ステップ1: Supabaseプロジェクト作成

1. [Supabase](https://supabase.com)にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力:
   - Name: `travel-community-app`
   - Database Password: 安全なパスワードを設定（メモしておく）
   - Region: `Northeast Asia (Tokyo)` 推奨
4. プロジェクト作成完了まで数分待つ

#### ステップ2: データベーススキーマの作成

Supabaseの「SQL Editor」で以下を実行:

```sql
-- ユーザーテーブル
CREATE TABLE users (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 旅行予定テーブル
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT REFERENCES users(discord_id),
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 合流募集テーブル
CREATE TABLE recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT REFERENCES users(discord_id),
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  max_participants INTEGER,
  participants JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- オフ会テーブル
CREATE TABLE meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT REFERENCES users(discord_id),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT DEFAULT 'Japan',
  is_date_decided BOOLEAN DEFAULT false,
  decided_date DATE,
  candidate_dates JSONB DEFAULT '[]',
  date_votes JSONB DEFAULT '{}',
  description TEXT,
  max_participants INTEGER,
  participants JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) の有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON trips FOR SELECT USING (true);
CREATE POLICY "Public read access" ON recruitments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON meetups FOR SELECT USING (true);

-- 認証ユーザーのみ書き込み可能
CREATE POLICY "Authenticated users can insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON recruitments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON meetups FOR INSERT WITH CHECK (true);

-- 自分のデータのみ更新・削除可能
CREATE POLICY "Users can update own data" ON trips FOR UPDATE USING (discord_id = current_setting('app.current_user_discord_id', true));
CREATE POLICY "Users can delete own data" ON trips FOR DELETE USING (discord_id = current_setting('app.current_user_discord_id', true));
CREATE POLICY "Users can update own recruitments" ON recruitments FOR UPDATE USING (discord_id = current_setting('app.current_user_discord_id', true));
CREATE POLICY "Users can delete own recruitments" ON recruitments FOR DELETE USING (discord_id = current_setting('app.current_user_discord_id', true));
CREATE POLICY "Users can update own meetups" ON meetups FOR UPDATE USING (discord_id = current_setting('app.current_user_discord_id', true));
CREATE POLICY "Users can delete own meetups" ON meetups FOR DELETE USING (discord_id = current_setting('app.current_user_discord_id', true));
```

#### ステップ3: API認証情報の取得

1. Supabaseプロジェクトの「Settings」→「API」にアクセス
2. 以下をメモ:
   - `Project URL`: `https://xxxxx.supabase.co`
   - `anon public` key: `eyJhbGc...`

### フェーズ2: Discord OAuth設定

#### ステップ1: Discord Application設定

1. [Discord Developer Portal](https://discord.com/developers/applications)
2. 既存のアプリケーションを選択（または新規作成）
3. 「OAuth2」→「Redirects」に追加:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
4. Client IDとClient Secretをメモ

#### ステップ2: SupabaseにDiscord認証を設定

1. Supabase「Authentication」→「Providers」
2. 「Discord」を有効化
3. Discord Client IDとClient Secretを入力
4. 保存

### フェーズ3: フロントエンド実装

Figma Makeで以下のコマンドを実行すれば、Supabase接続のサポートが受けられます：

```
Supabaseに接続して、LocalStorageの代わりにSupabaseでデータを管理するように変更してください
```

その際、上記で取得した**Project URL**と**anon key**を入力します。

### フェーズ4: デプロイ

Supabase対応後、以下の環境変数を設定してVercelまたはNetlifyにデプロイ:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 推奨フロー

### 最小限の労力で本格運用したい場合

1. ✅ **今すぐ**: オプション1でVercelにデプロイ（5分）
   - URLを共有してアプリの見た目を確認してもらえる
   - データ共有はまだできない

2. ✅ **後日**: オプション2でSupabase実装（30-60分）
   - Figma Makeに「Supabaseに接続」を依頼
   - データベース設定
   - 再デプロイ

### 最初から本格運用したい場合

- ✅ **オプション2を直接実装**
- コミュニティアプリとして完全な機能を提供

---

## よくある質問

### Q: LocalStorageのデータはSupabase移行後も残る？
A: はい、既存のLocalStorageデータは残りますが、新しいデータはSupabaseに保存されます。必要に応じてマイグレーションスクリプトを作成できます。

### Q: Supabaseの料金は？
A: 無料プランで以下が利用可能:
- 500MB データベース容量
- 1GB ファイルストレージ
- 50,000 月間アクティブユーザー
- 小規模〜中規模のコミュニティには十分

### Q: Discord認証は必須？
A: 現在の実装ではDiscord認証が前提ですが、必要に応じて他の認証方法も追加可能です。

### Q: カスタムドメインは使える？
A: はい、VercelもNetlifyも無料でカスタムドメインに対応しています。

---

## サポート

追加のサポートが必要な場合は、以下をお知らせください：

- 「オプション1でデプロイしたい」→ 詳細手順をサポート
- 「オプション2でSupabase実装したい」→ コード実装をサポート
- 「両方試したい」→ 段階的にサポート

どの方法で進めますか？
