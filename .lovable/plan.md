

## 登録機能の包括的修正

### 1. シークレット保存

`EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` に以下の値を保存:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpc2V0aGZteXZ2a29oYXV1bHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAyMjk4MiwiZXhwIjoyMDg0NTk4OTgyfQ.aHNO_AmTPdtuaaTD8UbeSIjy_1p34yf4PzsLXiSOZxQ
```

### 2. 新規Edge Function作成

`supabase/functions/register-influencer/index.ts`

- CORSヘッダー対応
- クライアントからLINEプロフィール情報（userId, displayName, pictureUrl）とユーザー入力（nickname, name, category）を受け取る
- `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` で外部Supabaseに接続しRLSをバイパス
- `influencers`テーブルにINSERT
- 成功時に登録データを返却

### 3. config.toml更新

```toml
[functions.register-influencer]
verify_jwt = false
```

### 4. RegisterProfile.tsx修正

- `supabaseExternal`の直接INSERTを削除
- Edge Function `register-influencer` を `fetch` で呼び出すように変更
- エラーハンドリング改善（サーバーからのエラーメッセージを表示）

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| シークレット | `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` を追加 |
| `supabase/functions/register-influencer/index.ts` | 新規作成 |
| `supabase/config.toml` | register-influencer設定追加 |
| `src/pages/auth/RegisterProfile.tsx` | Edge Function呼び出しに変更 |

