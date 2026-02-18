

## 登録失敗の包括的修正

### 1. シークレット追加

`EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` として提供されたキーを保存します。

### 2. 新規Edge Function作成: `register-influencer`

`supabase/functions/register-influencer/index.ts`

- クライアントからLINEプロフィール情報とユーザー入力を受け取る
- service_roleキーで外部Supabaseに接続しRLSをバイパス
- `influencers`テーブルにINSERT
- 成功時に登録データを返却

#### 設定

`supabase/config.toml`に`verify_jwt = false`を追加（LINE認証済みユーザーからの呼び出しのため）

### 3. `src/pages/auth/RegisterProfile.tsx` の修正

- `supabaseExternal`の直接INSERTを削除
- Edge Function `register-influencer` を呼び出すように変更
- エラーハンドリング改善

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| シークレット | `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` を追加 |
| `supabase/functions/register-influencer/index.ts` | 新規作成 |
| `supabase/config.toml` | `register-influencer`の設定追加 |
| `src/pages/auth/RegisterProfile.tsx` | Edge Function呼び出しに変更 |

