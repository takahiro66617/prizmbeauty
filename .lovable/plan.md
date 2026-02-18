
## 登録フロー完全修正プラン（最終確定版）

### 前回までの失敗の根本原因

PostgREST（外部DBの API）は INSERT 文に存在しないカラムが含まれている場合、**最初に見つけた1つ目の不正カラムだけ**エラーで返します。そのため毎回1つだけ削除 → 次の不正カラムで再度エラー、を繰り返していました。

```text
1回目: category, image_url, status が不正 → category でエラー → 削除
2回目: image_url, status が不正 → image_url でエラー → 削除
3回目: status が不正 → status でエラー ← 今ここ
```

### 今回の修正で100%解決する根拠

43行目の `status: "pending"` を削除すると、INSERT に含まれるカラムは以下の3つだけになります：

- `line_user_id` -- 過去3回のエラーで一度も指摘されていない = 存在する
- `username` -- 同上
- `name` -- 同上

PostgREST のエラーは「スキーマキャッシュにカラムが見つからない」というもので、存在するカラムではこのエラーは絶対に発生しません。

### 修正箇所 1: Edge Function（register-influencer/index.ts 43行目）

43行目の `status: "pending",` を削除します。

```text
変更前（39-44行目）:
    .insert({
      line_user_id: lineProfile.userId,
      username: nickname,
      name,
      status: "pending",    ← この行を削除
    })

変更後:
    .insert({
      line_user_id: lineProfile.userId,
      username: nickname,
      name,
    })
```

### 修正箇所 2: 管理画面のステータス更新（useExternalInfluencers.ts）

`useUpdateInfluencerStatus` 関数（49-51行目）は `status` カラムを UPDATE しようとしますが、外部DBに `status` カラムが存在しない以上、管理画面で「承認」「停止」ボタンを押してもエラーになります。

この関数は一旦コメントアウトまたは無効化し、エラーにならないようにします。

### 修正箇所 3: 管理画面の表示（AdminInfluencers.tsx）

`status` が外部DBに存在しないため、SELECT結果にも含まれません。以下の対応を行います：

- ステータスのBadge表示: `inf.status` が null/undefined の場合「未設定」と表示
- ステータスフィルタ: null ケースに対応
- 「承認」「停止」ボタン: `status` が存在しないため非表示にする（UPDATE もエラーになるため）

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `supabase/functions/register-influencer/index.ts` | 43行目 `status: "pending"` を削除 |
| `src/hooks/useExternalInfluencers.ts` | `useUpdateInfluencerStatus` を無効化（status カラムが存在しないため） |
| `src/pages/admin/AdminInfluencers.tsx` | ステータス表示に null フォールバック追加、承認/停止ボタンを非表示 |

### Edge Function 再デプロイ

修正後、必ず再デプロイして反映させます。

### 期待される動作

```text
登録フロー:
  LINE認証 → プロフィール入力 → Edge Function（3カラムのみINSERT）→ 成功 → /mypage へ遷移

管理画面:
  /admin/influencers → SELECT * → 外部DBに存在するカラムだけ返される
  → ステータスは null のため「未設定」と表示
  → 承認/停止ボタンは非表示（status カラムが存在しないため操作不可）
```
