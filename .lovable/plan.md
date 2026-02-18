
## LINE連携・管理画面 不整合修正プラン

### 現状の問題

| 問題 | 影響 |
|---|---|
| 登録時のステータスが`active`だが、管理画面は`approved`/`pending`/`suspended`で管理 | LINE登録者がフィルタに引っかからない |
| インターフェースに`line_user_id`がない | 管理画面でLINE連携情報を表示できない |
| `user_id`が必須型のまま | 実態と型定義が不一致 |
| 管理画面にLINE ID表示がない | LINE経由の登録者を識別できない |

### 修正内容

#### 1. `src/pages/auth/RegisterProfile.tsx`

- 登録時のステータスを`"active"`から`"pending"`に変更
- これにより新規LINE登録者は管理画面で「審査中」として表示され、管理者が承認フローを回せるようになる

#### 2. `src/hooks/useExternalInfluencers.ts`

`ExternalInfluencer`インターフェースを実態に合わせて更新:

- `user_id`を`string | null`（オプショナル）に変更
- `line_user_id: string | null`を追加

#### 3. `src/pages/admin/AdminInfluencers.tsx`

- テーブルに「LINE連携」列を追加し、`line_user_id`の有無でLINE経由登録者を識別できるようにする
- ステータスフィルタに`active`も追加（過去データとの互換性のため）

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/pages/auth/RegisterProfile.tsx` | `status: "active"` を `status: "pending"` に変更 |
| `src/hooks/useExternalInfluencers.ts` | `user_id`をオプショナル化、`line_user_id`を追加 |
| `src/pages/admin/AdminInfluencers.tsx` | LINE連携列の追加、`active`ステータス対応 |
