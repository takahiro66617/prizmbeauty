

## 問題の整理

調査の結果、以下の問題を特定しました：

### 1. 口座保存の失敗（根本原因）
- `upsert-my-bank-account` Edge Functionで `influencer_profiles` の検証に `.single()` を使用しており、プロファイルが見つからない場合にエラーになる
- LINE認証ユーザーの `sessionStorage.currentUser.id` が `influencer_profiles.id` と一致しない可能性がある
- Auth認証ユーザーの場合、RLS経由で直接操作するが、既存データの `user_id` が `influencer_profiles.id`（LINE登録時）と `auth.uid()`（Auth登録時）で不整合が起きている可能性

### 2. 企業側への口座情報反映は既に実装済み
- `get-company-payments` Edge Functionがbank_accountsを取得して企業に表示 ✅
- `send-status-notification` がpost_confirmed時にbank情報を自動送信 ✅  
- `ClientPayments.tsx` がbank_account情報を表示 ✅

### 3. 口座更新時の全ページ同期が不完全
- 口座保存成功後、`useInfluencerReadiness` のキャッシュが更新されない
- 企業側の`get-company-payments`は毎回取得するので最新が反映される（OK）

## 修正計画

### ファイル1: `src/hooks/usePayments.ts` — 口座保存ロジックの堅牢化
- Auth認証ユーザー: `session.user.id` で直接テーブル操作（現行維持）
- LINE認証ユーザー: Edge Function経由で操作（現行維持）
- **追加**: 保存成功後に `bank-account` と `influencer-readiness` の両方のクエリキャッシュを無効化し、バナーが即座に消えるようにする
- **追加**: エラー発生時に具体的な原因をconsole.errorで出力

### ファイル2: `supabase/functions/upsert-my-bank-account/index.ts` — 堅牢化
- `.single()` を `.maybeSingle()` に変更（プロファイル検証）
- `user_id` でも `id` でもプロファイルを検索するように変更（IDの不整合対応）
- エラーメッセージを具体的に

### ファイル3: `src/hooks/useInfluencerReadiness.ts` — キャッシュ連動
- React Queryの `queryKey` を使い、`useBankAccount` と同じキーで口座状態を監視
- 口座保存後の再チェックが確実に走るようにする

### ファイル4: `src/pages/mypage/MyPageRewards.tsx` — 保存後のバナー連動
- 口座保存成功後に `influencer-readiness` クエリも無効化

### ファイル5: `supabase/functions/send-status-notification/index.ts` — bank_account検索の堅牢化
- `post_confirmed` 時のbank_account検索で `user_id` と `influencer_profiles.id` の両方でフォールバック検索

## 変更しないもの（既に正しく動作）
- `get-company-payments` Edge Function — 企業側の口座表示は正常
- `ClientPayments.tsx` — 口座情報の表示UIは完成済み
- `ClientApplicantDetail.tsx` / `ClientApplicants.tsx` — 振込先情報表示済み

