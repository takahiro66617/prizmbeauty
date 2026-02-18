

## 再ログイン時の動線修正プラン

### 問題の原因

LINE認証フローに2つの問題があります：

1. **`line-auth` Edge Function**: 既存ユーザーの確認を**外部DB**（`hisethfmyvvkohauuluq`の`influencers`テーブル）で行っている。登録先はLovable Cloud DBに切り替え済みなので、ここにはデータがなく、毎回「新規ユーザー」と判定される。
2. **`register-influencer` Edge Function**: 重複チェックがなく、既に登録済みのユーザーがもう一度INSERTしようとすると `duplicate key` エラーが発生する。

```text
現在の動線（壊れている）:
  LINE認証 → line-auth（外部DBを確認）→ ユーザーいない！
  → 登録画面へ → register-influencer（INSERT）→ duplicate key エラー

正しい動線:
  LINE認証 → line-auth（Lovable Cloud DBを確認）→ ユーザーいる！
  → そのままマイページへ
```

### 修正内容

#### 1. `supabase/functions/line-auth/index.ts`

既存ユーザー確認を外部DBからLovable Cloud DBに切り替えます。

- 外部DBの接続情報（`EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_ANON_KEY`）を削除
- Lovable Cloud DBへの接続（`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`）を使用
- テーブルを `influencers` → `influencer_profiles` に変更
- `line_user_id` で検索

#### 2. `supabase/functions/register-influencer/index.ts`

既に同じ `line_user_id` のユーザーが存在する場合、INSERTではなく既存データを返すようにします（upsert的な動作）。

- INSERT前に `line_user_id` で既存チェック
- 既存ユーザーが見つかった場合は `{ success: true, data: existing }` を返す
- 新規の場合のみINSERT

#### 3. `src/pages/auth/LineCallback.tsx`

`line-auth` のレスポンスで `user` が返ってきた場合（既存ユーザー）、直接マイページへ遷移する処理は既にありますが、`line-auth`が正しいDBを見るようになれば自動的に動作します。変更は不要。

### 修正後の動線

```text
初回登録:
  LINE認証 → line-auth（Cloud DBを確認）→ ユーザーいない
  → 登録画面 → register-influencer（INSERT成功）→ マイページ

2回目以降のログイン:
  LINE認証 → line-auth（Cloud DBを確認）→ ユーザーいる！
  → LineCallback.tsxで既存ユーザーと判定 → マイページへ直行

万が一登録画面に到達した場合（安全策）:
  register-influencer → 既存チェック → 既存データを返す → マイページへ
```

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `supabase/functions/line-auth/index.ts` | 外部DB参照を削除、Lovable Cloud DBの `influencer_profiles` を確認するよう変更 |
| `supabase/functions/register-influencer/index.ts` | INSERT前に既存ユーザーチェックを追加（重複エラー防止） |

両Edge Functionを再デプロイします。
