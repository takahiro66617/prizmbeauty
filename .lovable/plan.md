

## Lovable Cloud DB切り替え＆登録フロー修正プラン

### なぜ今まで失敗し続けたのか（根本原因）

外部DB（`hisethfmyvvkohauuluq`）の `influencers` テーブルに `category`, `image_url`, `status`, `username` カラムが存在しなかったのに、コードから1つずつ削除するという対症療法を繰り返していた。**テーブル構造自体を修正する**という正しいアプローチを取らなかったのが原因。

### 今回のアプローチ：Lovable Cloud DBに切り替え

Lovable Cloud DBの `influencer_profiles` テーブルには必要なカラムが**全て揃っている**ため、スキーマ不一致エラーは発生しない。

```text
Lovable Cloud DB の influencer_profiles テーブル:
  id, user_id, username, name, bio, image_url, category, status,
  instagram_followers, tiktok_followers, youtube_followers, twitter_followers,
  created_at, updated_at
```

### 必要なDB変更

`influencer_profiles` テーブルに以下の変更が必要:

1. `line_user_id` カラム追加（TEXT型、UNIQUE） -- LINEユーザー識別用
2. `user_id` を NULL許容に変更 -- LINEログインユーザーはSupabase Authアカウントを持たないため

### RLSポリシーの追加

Edge FunctionがService Role Keyで書き込むため、既存のRLSポリシーはバイパスされる（Service Roleは全てのポリシーを無視する）。読み取りは既に `true` でSELECT可能。問題なし。

### 修正ファイル一覧

| ファイル | 変更内容 |
|---|---|
| DB migration | `line_user_id` 追加、`user_id` NULL許容化 |
| `supabase/functions/register-influencer/index.ts` | 接続先をLovable Cloud DBに変更。全フィールド（username, category等）をINSERT |
| `src/pages/auth/RegisterProfile.tsx` | 全入力項目（ニックネーム、性別、生年月日、居住地、ジャンル）を維持。Edge Functionへ送信するデータにcategory等を追加 |
| `src/hooks/useExternalInfluencers.ts` | `supabaseExternal` → Lovable Cloud の `supabase` クライアントに変更。テーブル名を `influencer_profiles` に変更 |
| `src/pages/admin/AdminInfluencers.tsx` | 全カラムが存在するので、username, category, status, SNSフォロワー数が正常に表示される。ステータス更新ボタンも復活 |
| `src/pages/auth/LineCallback.tsx` | 既存ユーザー確認クエリをLovable Cloud DBに変更 |

### 技術詳細

#### DB Migration（SQL）

```text
ALTER TABLE influencer_profiles
  ADD COLUMN line_user_id TEXT UNIQUE;

ALTER TABLE influencer_profiles
  ALTER COLUMN user_id DROP NOT NULL;
```

#### Edge Function変更（register-influencer/index.ts）

- 接続先: `EXTERNAL_SUPABASE_URL` → 環境変数 `SUPABASE_URL`（Lovable Cloud DB）
- 認証キー: `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`
- テーブル名: `influencers` → `influencer_profiles`
- INSERT対象カラム: `line_user_id`, `username`（nickname）, `name`, `category`, `image_url`（LINE写真URL）, `status`（"pending"）

フロントから送信された全データを保存できるようになる。

#### RegisterProfile.tsx変更

- 現在の入力項目（姓、名、ニックネーム、性別、生年月日、居住地、主な投稿ジャンル）を全て維持
- `handleSubmit` で Edge Function に `category`（選択したジャンル）、`image_url`（LINE写真）も送信
- `bio` フィールドに「性別 / 生年月日 / 居住地」を格納（専用カラムが無いため）

#### useExternalInfluencers.ts変更

```text
変更前: supabaseExternal.from("influencers")
変更後: supabase.from("influencer_profiles")
```

- `supabase` は `@/integrations/supabase/client` からインポート
- インターフェースはそのまま（全カラムが存在するため）

#### LineCallback.tsx変更

- 既存ユーザー判定: `supabaseExternal.from("influencers").select("*").eq("line_user_id", ...)` → `supabase.from("influencer_profiles").select("*").eq("line_user_id", ...)`

### 外部DBとの関係

- `useExternalApplications`、`useExternalCampaigns`、`useExternalCompanies` 等は引き続き外部DBを使用
- インフルエンサーのデータだけLovable Cloud DBに移行
- 将来的に全体を移行する際は、同様の手順で各テーブルを切り替え可能

### 期待される動作

```text
登録フロー:
  LINE認証 → プロフィール入力（姓名、ニックネーム、性別、生年月日、居住地、ジャンル）
  → Edge Function（Lovable Cloud DB の influencer_profiles にINSERT）
  → 全カラムが存在するので INSERT成功
  → /mypage へ遷移

管理画面:
  /admin/influencers → influencer_profiles から SELECT *
  → username, category, status, SNSフォロワー数が全て正常表示
  → ステータス更新（承認/停止）も動作
```
