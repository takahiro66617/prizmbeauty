

## 登録フロー完全修正プラン（徹底版）

### 根本原因

Edge Function `register-influencer/index.ts` の43行目に `image_url` カラムがまだ残っている。外部DBの `influencers` テーブルには `image_url` カラムが存在しないため、INSERT が `PGRST204` エラーで失敗する。

これは前回の修正で `category` は削除されたが、`image_url` の削除が漏れていたことが原因。

### 外部DBに存在しないカラム（確認済み）

- `category` -- 前回のエラーで確認済み
- `image_url` -- 今回のエラーで確認済み（`Could not find the 'image_url' column of 'influencers' in the schema cache`）

### 修正内容

#### 1. Edge Function修正: `supabase/functions/register-influencer/index.ts`（43行目）

`image_url` をINSERT文から削除し、確実に存在する4カラムのみ使用。

```text
変更前（39-45行目）:
  .insert({
    line_user_id: lineProfile.userId,
    username: nickname,
    name,
    image_url: lineProfile.pictureUrl || null,
    status: "pending",
  })

変更後:
  .insert({
    line_user_id: lineProfile.userId,
    username: nickname,
    name,
    status: "pending",
  })
```

#### 2. Edge Functionの再デプロイ

変更後、Edge Functionを再デプロイして反映させる。

### 変更不要の確認（網羅チェック）

| 項目 | 状態 | 理由 |
|---|---|---|
| `supabase/config.toml` | 変更不要 | `verify_jwt = false` 設定済み |
| シークレット `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | 変更不要 | 設定済み |
| `src/pages/auth/RegisterProfile.tsx` | 変更不要 | `pictureUrl` はEdge Functionに送られるが、Edge Function側で使わなければエラーにならない |
| `src/pages/auth/LineCallback.tsx` | 変更不要 | 新規ユーザー判定と `/auth/register/profile` への遷移は正しい |
| `src/components/layout/MyPageLayout.tsx` | 変更不要 | `sessionStorage` の `currentUser` で認証チェック、正常 |
| `src/pages/mypage/MyPageDashboard.tsx` | 変更不要 | `sessionStorage` から取得、正常 |
| `src/hooks/useExternalInfluencers.ts` | 変更不要 | `SELECT *` は存在するカラムのみ返す。TypeScriptインターフェースに `image_url` があっても `null` になるだけ |
| `src/pages/admin/AdminInfluencers.tsx` | 変更不要 | `image_url` が `null` の場合 `ui-avatars.com` のフォールバックが既にある（78行目） |
| `src/lib/supabaseExternal.ts` | 変更不要 | anon keyでの読み取りは正常 |
| `src/App.tsx` ルーティング | 変更不要 | `/auth/register/profile` と `/mypage` のルートは正しく設定済み |

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `supabase/functions/register-influencer/index.ts` | 43行目の `image_url` 行を削除 |

### 期待される動作フロー

```text
LINE認証 → LineCallback（新規ユーザー判定）
  → /auth/register/profile（プロフィール入力）
  → Edge Function呼び出し（line_user_id, username, name, status の4カラムのみ）
  → INSERT成功 → レスポンスにデータ返却
  → sessionStorageにユーザー情報保存
  → /mypage に遷移 → ダッシュボード表示

管理者:
  /admin/influencers → useExternalInfluencers（SELECT *）
  → 新規インフルエンサーが status: pending で表示
  → image_url は null のため ui-avatars.com のアバターが表示される
```

