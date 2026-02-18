

## 問題の根本原因

エッジファンクションのログ:
```
column influencers.line_user_id does not exist
```

外部DBの`influencers`テーブルには`line_user_id`カラムが存在しません。LINE UserIDは`user_id`カラムに保存する必要があります。また、プロフィール登録時に存在しないカラム（`nickname`, `gender`, `birth_date`, `prefecture`, `line_user_id`）への挿入も失敗します。

## 修正内容

### 1. エッジファンクション `supabase/functions/line-auth/index.ts`

LINE UserIDでの検索を`line_user_id`から`user_id`に変更:

```
// 変更前
.eq("line_user_id", profileData.userId)

// 変更後
.eq("user_id", profileData.userId)
```

### 2. プロフィール登録 `src/pages/auth/RegisterProfile.tsx`

挿入データから存在しないカラムを削除:

| 変更前のカラム | 対応 |
|---|---|
| `line_user_id` | 削除（`user_id`に統合） |
| `nickname` | 削除（存在しないカラム） |
| `gender` | 削除（存在しないカラム） |
| `birth_date` | 削除（存在しないカラム） |
| `prefecture` | 削除（存在しないカラム） |

挿入データは以下のみに:
- `user_id` (LINE userId)
- `username` (ニックネーム)
- `name` (姓名)
- `image_url`
- `category`
- `status`

### 技術的な補足

UIのフォーム（性別・生年月日・居住地）は残しますが、外部DBに対応カラムがないため、これらの値はDB保存されません。将来的に外部DBにカラムを追加した際に再度挿入処理に追加できます。

## 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `supabase/functions/line-auth/index.ts` | `line_user_id` を `user_id` に変更 |
| `src/pages/auth/RegisterProfile.tsx` | 存在しないカラムを挿入データから削除 |

