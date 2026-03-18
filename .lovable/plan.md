
問題の認識は一致しています。今回の失敗は、保存処理そのものより「ユーザーIDの取り方」が崩れているのが主因です。

## 調査で特定した原因
1. `src/hooks/usePayments.ts` の `getLineInfluencerProfileId()` が `localStorage.line_user` を参照していますが、現行のLINEログイン導線は `sessionStorage.currentUser.id` を使っています（`line_user` は実質未使用）。
2. その結果、LINEユーザーで `profileId` が取れず、`useUpsertBankAccount` が `Not authenticated` を投げて保存失敗になります。
3. さらに auth セッションがある場合に `bankUserId = profileId || userId` としており、`profileId` 側を使うと RLS 条件 (`user_id = auth.uid()`) と不一致になって失敗し得ます。
4. `useInfluencerReadiness.ts` の口座確認も `localStorage.line_user` 依存のため、保存後でも警告バナーが残る経路があります。

## 実装計画
1. **ID解決ロジックを統一（最優先）**
   - `usePayments.ts` に共通ヘルパーを作成し、優先順を  
     `sessionStorage.currentUser.id` → `localStorage.line_user.influencerProfileId` → `localStorage.line_user.id`  
     に変更。
2. **口座保存の分岐を修正**
   - auth セッションあり: `user_id` は **必ず** `session.user.id` を使用（`profileId`を混ぜない）。
   - auth セッションなし + profileIdあり: `upsert-my-bank-account` を呼ぶ。
   - どちらも無い: 明示エラー（再ログイン案内）。
3. **口座取得・報酬取得も同じID解決を適用**
   - `useBankAccount` / `usePayments` で同じ統一ヘルパーを使い、LINEユーザーで正しくデータ取得できるようにする。
4. **警告バナー判定の口座チェックを修正**
   - `useInfluencerReadiness.ts` の口座確認で `sessionStorage.currentUser.id` ベースに変更。
   - 必要に応じて auth 経路で未取得時のフォールバックを追加し、保存後にバナーが確実に消えるようにする。
5. **エラーメッセージ改善**
   - `MyPageSettings.tsx` / `MyPageRewards.tsx` の `onError` を詳細表示（例: 「再ログインしてください」）に変更し、再発時の原因が即分かるようにする。

## 技術詳細（実装対象ファイル）
- `src/hooks/usePayments.ts`（主修正）
- `src/hooks/useInfluencerReadiness.ts`（バナー連動修正）
- `src/pages/mypage/MyPageSettings.tsx`（エラー表示改善）
- `src/pages/mypage/MyPageRewards.tsx`（エラー表示改善）

## 完了条件
- 口座保存が成功する（Settings内「報酬」タブ・Rewardsページ双方）
- 保存直後に口座情報が再取得される
- SNS要件を満たした状態で、口座保存後に「案件応募に必要な情報が未登録」バナーが消える
- 失敗時は原因が分かる文言が表示される
