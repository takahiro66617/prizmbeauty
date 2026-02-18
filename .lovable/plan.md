

## 登録フロー完全修正プラン

### 現状の問題

1. **データベースエラー**: Edge Function が `category` カラムに書き込もうとしているが、外部DBの `influencers` テーブルにそのカラムが存在しない
2. **登録後の遷移**: 登録成功後にインフルエンサー管理画面（/mypage）に正しく遷移できていない
3. **管理画面との連携**: 登録データが管理画面（/admin/influencers）に表示されるべき

### 修正内容

#### 1. Edge Function修正: `supabase/functions/register-influencer/index.ts`

**問題**: `category` カラムが外部DBに存在しない

**修正**:
- INSERT文から `category` フィールドを削除する
- 外部DBに実際に存在するカラムのみを使用: `line_user_id`, `username`, `name`, `image_url`, `status`

```text
変更前:
  .insert({
    line_user_id, username, name, image_url, category, status
  })

変更後:
  .insert({
    line_user_id, username, name, image_url, status
  })
```

#### 2. フロントエンド修正: `src/pages/auth/RegisterProfile.tsx`

- `handleSubmit` の `fetch` ボディから `category` を削除
- ジャンル選択のUI自体は残してもよいが、送信データには含めない（将来的にDB側にカラムが追加された際に使用可能）

#### 3. 確認事項（変更不要）

以下は既に正しく実装されているため変更不要:
- **ルーティング**: `/auth/register/profile` → 登録完了 → `/mypage` への遷移は `RegisterProfile.tsx` の `navigate("/mypage")` で実装済み
- **セッション管理**: `sessionStorage.setItem("currentUser", ...)` で `MyPageLayout` の認証チェックを通過可能
- **管理画面表示**: `AdminInfluencers.tsx` は `useExternalInfluencers` フックで外部DBの `influencers` テーブルを直接読み取るため、登録されたデータは自動的に表示される
- **LINE認証フロー**: `LineCallback.tsx` → 新規ユーザー判定 → `/auth/register/profile` への遷移は正しく動作
- **config.toml**: `verify_jwt = false` 設定済み
- **シークレット**: `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` 設定済み

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `supabase/functions/register-influencer/index.ts` | INSERT文から `category` を削除 |
| `src/pages/auth/RegisterProfile.tsx` | fetch送信データから `category` を削除 |

### 期待される動作フロー

```text
LINE認証 → LineCallback.tsx（新規ユーザー判定）
  → /auth/register/profile（プロフィール入力）
  → Edge Function呼び出し（category なしでINSERT）
  → 成功 → sessionStorageにユーザー情報保存
  → /mypage（インフルエンサーダッシュボード）に遷移

管理者:
  /admin/influencers → useExternalInfluencers → 外部DB読み取り
  → 登録されたインフルエンサーが一覧に表示される（status: pending）
```

