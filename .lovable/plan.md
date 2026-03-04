
現状を確認したところ、未反映に見える原因は2つです。

1) 投稿確認済（post_confirmed）時の自動文面に「振込期日（payment_date）」が含まれていない  
2) LINEログイン系インフルエンサーは認証セッションが無く、現行の報酬管理（usePayments/useBankAccount）が口座保存できないため、銀行情報が空のままになりやすい

---

## 実装方針（今回の修正内容）

### A. 投稿確認後に「振込先 + 振込期日」を必ず自動出力
- 対象: `supabase/functions/send-status-notification/index.ts`
- `post_confirmed` 遷移時に、企業側スレッドへ自動で1通出す内容を統一:
  - 振込先情報（登録済みなら口座詳細）
  - 振込期日（`campaigns.payment_date`。未設定なら「未設定」表示）
- 銀行口座が未登録でも、企業側に「未登録 + 振込期日」を明示して、進行が止まって見えないようにする
- 併せてインフルエンサー側には登録促進メッセージ/通知を送る（現行挙動は維持）

### B. LINEログインのインフルエンサーでも口座登録できるようにする
- 対象: 新規バックエンド関数 + `src/hooks/usePayments.ts`
- 新規関数（公開呼び出し）を追加:
  - `get-my-bank-account`
  - `upsert-my-bank-account`
  - `get-my-payments`
- `usePayments.ts` を「認証セッションあり/なし」で分岐:
  - あり: 現行のDBクエリ（そのまま）
  - なし（LINE）: 上記関数を呼ぶ
- これでインフルエンサーが実際に口座登録でき、post_confirmed後の自動送信が成立する

### C. スレッド表示の明確化
- 対象: `src/components/ThreadConversation.tsx`
- `bank_info` メッセージ文面に「振込期日」行が出るため、現行の緑カード表示をそのまま活用
- 必要なら案件詳細パネルにも「振込予定日」を表示（補助表示）

---

## 変更対象ファイル（予定）
- `supabase/functions/send-status-notification/index.ts`
- `supabase/functions/get-my-bank-account/index.ts`（新規）
- `supabase/functions/upsert-my-bank-account/index.ts`（新規）
- `supabase/functions/get-my-payments/index.ts`（新規）
- `supabase/config.toml`（上記関数の `verify_jwt = false` 追加）
- `src/hooks/usePayments.ts`
- （任意補助）`src/components/ThreadConversation.tsx`

---

## 受け入れ条件（E2E）
1. インフルエンサーが投稿報告 → 企業が「投稿承認」  
   → スレッドに自動で「振込先情報（または未登録通知）+ 振込期日」が表示される  
2. LINEログインのインフルエンサーでも報酬管理画面で口座を保存できる  
3. 口座登録後に再度 post_confirmed になると、企業側に口座詳細が自動送信される  
4. `payment_date` 未設定案件でも、メッセージ上で未設定と分かる

---

## 技術詳細（実装上の要点）
- `send-status-notification` の application 取得selectに `campaigns.payment_date` を追加
- 銀行口座取得は `maybeSingle()` ベースで扱い、0件時も正常系として文面分岐
- 口座データキーは現行設計に合わせて  
  - 認証ユーザー: `user_id = auth.uid()`  
  - LINEユーザー: `user_id = influencer_profile.id`  
- セキュリティは既存設計を踏襲し、クライアント直DBではなくバックエンド関数経由で処理

この方針で進めれば、「投稿確認後に自動で出ない」「何度言っても反映されない」状態を、実際の運用フロー上で解消できます。
