

## LINEログイン修正プラン

外部DBに`line_user_id`カラムが追加されたので、コードを修正してLINEログインを完成させます。

### 変更内容

#### 1. エッジファンクション（LINE認証処理）

診断用コードを全て削除し、シンプルな処理に書き直す:

- LINE認証コードをトークンに交換
- LINEプロフィールを取得
- `line_user_id`カラムで既存ユーザーを検索
- 見つかれば既存ユーザーとしてログイン、見つからなければ新規登録画面へ

#### 2. プロフィール登録画面

登録時のデータ保存を修正:

- `user_id`（存在しないカラム）の代わりに`line_user_id`を使用
- 存在するカラムのみに挿入を限定: `line_user_id`, `username`, `name`, `image_url`, `category`, `status`

### 技術的な詳細

**エッジファンクション `supabase/functions/line-auth/index.ts`**

変更点:
- 26個のカラム診断クエリを全て削除
- `line_user_id`カラムで`.eq("line_user_id", profileData.userId)`による検索を実装
- DB検索エラー時はフォールバックとして新規ユーザー扱い（500エラーを返さない）

**プロフィール登録 `src/pages/auth/RegisterProfile.tsx`**

変更点:
- `.insert()`の`user_id`を`line_user_id`に変更
- 存在しないカラム（`nickname`, `gender`, `birth_date`, `prefecture`）は挿入しない

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `supabase/functions/line-auth/index.ts` | 診断コード全削除、`line_user_id`での検索に修正 |
| `src/pages/auth/RegisterProfile.tsx` | `user_id`を`line_user_id`に変更 |

