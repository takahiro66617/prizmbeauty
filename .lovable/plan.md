

## 管理画面の連携問題 - 根本原因と修正計画

### 根本原因

管理者（事務局）はハードコード認証（sessionStorage）でログインしており、**Supabase Authセッションを持っていない**。そのため：

1. **RLS（行レベルセキュリティ）で全ての書き込み操作が拒否される**
   - 案件の承認・却下（`campaigns` UPDATE → `auth.uid()` が null → 失敗）
   - 応募ステータスの変更（`applications` UPDATE → 同上）
   - 企業情報の編集（`companies` UPDATE → 同上）
   - 企業の削除（`companies` DELETE → 同上）

2. **RLSで一部の読み取りも失敗する**
   - `applications` の SELECT → `auth.uid()` 必須 → 空配列が返る
   - これにより案件管理画面の「応募数」が常に0、応募管理画面も空

3. **`revision_requested` が `applications` テーブルのCHECK制約に含まれていない**
   - 修正依頼ステータスへの遷移がDBレベルで拒否される

4. **管理者メッセージ画面のsenderIdが空**
   - `supabase.auth.getSession()` が null → メッセージ送信不可

### 修正計画

#### 1. 管理者用Edge Function `admin-manage-data` を新規作成
Service Role Keyを使用し、以下の操作を一つのEdge Functionで処理：
- 案件の更新（承認・却下・編集）
- 案件の削除
- 応募の一覧取得（admin用）
- 応募ステータスの更新
- 企業情報の更新
- 企業の削除

```text
POST /admin-manage-data
body: { action: "update_campaign" | "delete_campaign" | "get_applications" | "update_application" | "update_company" | "delete_company", ... }
```

#### 2. DB制約の修正
`applications_status_check` に `revision_requested` を追加

#### 3. フロントエンド修正（4ファイル）

- **`useExternalCampaigns.ts`**: `useUpdateCampaign` / `useDeleteCampaign` に `adminMode` オプション追加。trueの場合はEdge Function経由
- **`useExternalApplications.ts`**: admin用の取得をEdge Function経由に変更。`useUpdateApplicationStatus` も同様
- **`useExternalCompanies.ts`**: `useUpdateCompany` / delete にadminMode追加
- **`AdminMessages.tsx`**: `adminUserId` の取得を固定値またはEdge Functionから取得する方式に変更

#### 4. 管理画面ページの修正
- **`AdminCampaigns.tsx`**: Edge Function経由でステータス更新
- **`AdminApplications.tsx`**: Edge Function経由でステータス更新
- **`AdminClients.tsx`**: Edge Function経由で企業編集・削除

### 変更ファイル一覧
1. `supabase/functions/admin-manage-data/index.ts` （新規）
2. DB migration: `revision_requested` をCHECK制約に追加
3. `src/hooks/useExternalCampaigns.ts`
4. `src/hooks/useExternalApplications.ts`
5. `src/hooks/useExternalCompanies.ts`
6. `src/pages/admin/AdminCampaigns.tsx`
7. `src/pages/admin/AdminApplications.tsx`
8. `src/pages/admin/AdminClients.tsx`
9. `src/pages/admin/AdminMessages.tsx`

