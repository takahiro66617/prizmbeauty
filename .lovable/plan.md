

# 外部Supabaseデータベース接続 実装計画

## 概要

現在モックデータ（`mockData.ts`）で動いている全画面を、外部Supabaseデータベース（`hisethfmyvvkohauuluq.supabase.co`）のリアルデータに切り替えます。SQLの実行は完了済みなので、あとはコード側の実装のみです。

## 実装内容

### 1. 外部Supabaseクライアント作成
- `src/lib/supabaseExternal.ts` を新規作成
- 外部Supabaseの接続情報（URL + anon key）を使用
- 既存のLovable Cloudクライアント（`src/integrations/supabase/client.ts`）には触れない

### 2. データ取得用カスタムフック作成（6ファイル）

TanStack React Query を使い、外部Supabaseからデータを取得・更新するフックを作成:

| フック | 機能 |
|--------|------|
| `useExternalCompanies` | 企業一覧取得・更新 |
| `useExternalCampaigns` | 案件一覧取得・作成 |
| `useExternalInfluencers` | IF一覧取得・ステータス更新 |
| `useExternalApplications` | 応募一覧取得・承認/却下 |
| `useExternalMessages` | メッセージ取得・送信 |
| `useExternalNotifications` | 通知取得・既読処理 |

### 3. ログイン画面の変更（3画面）

- **管理者ログイン** (`AdminLogin.tsx`): ハードコードのままで維持（管理者は固定アカウント）
- **企業ログイン** (`ClientLogin.tsx`): 外部Supabase の `companies` テーブルの `contact_email` で照合
- **インフルエンサーログイン** (`Login.tsx`): 外部Supabase の `influencers` テーブルのメールで照合

### 4. 全管理画面をリアルデータに切り替え（約20ファイル）

**企業管理画面（/client/*）:**
- `ClientDashboard.tsx` - リアルデータでKPI表示
- `ClientCampaigns.tsx` - 自社案件をDBから取得
- `ClientCampaignNew.tsx` - 案件作成を実際にDBにINSERT
- `ClientApplicants.tsx` - 採用/不採用ボタンが実際にDBをUPDATE
- `ClientMessages.tsx` - メッセージをDBから取得・返信INSERT
- `ClientSettings.tsx` - 企業情報の保存がDBをUPDATE
- `ClientLayout.tsx` - 企業名をDBから取得

**管理者画面（/admin/*）:**
- `AdminDashboard.tsx` - 全体統計をDBから算出
- `AdminCampaigns.tsx` - 全案件をDBから取得
- `AdminClients.tsx` - 企業一覧をDBから取得
- `AdminInfluencers.tsx` - IF一覧をDBから取得、承認/停止をUPDATE
- `AdminApplications.tsx` - 全応募をDBから取得

**インフルエンサー画面（/mypage/*）:**
- `MyPageDashboard.tsx` - 自分の統計をDBから表示
- `MyPageApplications.tsx` - 応募履歴をDBから取得
- `MyPageMessages.tsx` - メッセージをDBから取得
- `MyPageNotifications.tsx` - 通知をDBから取得

### 5. 操作ボタンの実装

現在UIだけで機能しないボタンを全て接続:
- 「採用」「不採用」ボタン → `applications.status` をUPDATE
- 「承認」「停止」ボタン → `influencers.status` / `companies.status` をUPDATE
- 案件作成フォーム → `campaigns` テーブルにINSERT
- メッセージ返信 → `messages` テーブルにINSERT
- 企業設定保存 → `companies` テーブルをUPDATE

---

## 技術詳細

### 外部Supabaseクライアント

```text
// src/lib/supabaseExternal.ts
import { createClient } from '@supabase/supabase-js'

const EXTERNAL_URL = "https://hisethfmyvvkohauuluq.supabase.co"
const EXTERNAL_ANON_KEY = "eyJhbGciOiJIUzI1NiIs..."

export const supabaseExternal = createClient(EXTERNAL_URL, EXTERNAL_ANON_KEY)
```

### カスタムフックの例

```text
// src/hooks/useExternalCampaigns.ts
export function useExternalCampaigns(companyId?: string) {
  return useQuery({
    queryKey: ['ext-campaigns', companyId],
    queryFn: async () => {
      let query = supabaseExternal.from('campaigns').select('*');
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}
```

### ファイル一覧

| 種別 | ファイル |
|------|---------|
| 新規 | `src/lib/supabaseExternal.ts` |
| 新規 | `src/hooks/useExternalCompanies.ts` |
| 新規 | `src/hooks/useExternalCampaigns.ts` |
| 新規 | `src/hooks/useExternalInfluencers.ts` |
| 新規 | `src/hooks/useExternalApplications.ts` |
| 新規 | `src/hooks/useExternalMessages.ts` |
| 新規 | `src/hooks/useExternalNotifications.ts` |
| 更新 | 上記の約20ページファイル |

### 注意点

- `mockData.ts` のインポートを全て外部Supabaseフックに置き換え
- ローディング状態とエラーハンドリングを各画面に追加
- `sessionStorage` によるログイン管理は維持（認証はSupabase Auth未使用）
- 外部Supabaseのテーブルに合わせてフィールド名を調整（例: `contact_email` など）

