

# バグレポート「対応中」全件修正計画

バグレポートDBから「対応中」のレポート13件を確認しました。以下、全件の修正内容をまとめます。

---

## 修正対象一覧

### 1. 電話番号バリデーション追加
**レポート:** 電話番号の部分なんでも入れられる  
**現状:** `replace(/[^\d\-+()]/g, "")` で文字フィルタのみ、バリデーションなし  
**修正:** 以下の全箇所に電話番号バリデーション（`/^[\d\-+()]{10,15}$/`）と日本語エラーメッセージ「正しい電話番号を入力してください」を追加
- `AdminClientDetail.tsx` — 企業編集フォーム
- `AdminClients.tsx` — 新規企業登録モーダル
- `ClientSettings.tsx` — 企業設定ページ
- `MyPageSettings.tsx` — インフルエンサー設定ページ

### 2. 企業詳細・編集の保存が効かない
**レポート:** 企業詳細・編集の保存ができない  
**原因:** `useAdminUpdateCompany`は`admin-manage-data`のEdge Functionを使用。`update_company`アクションは正常に見えるが、`editForm`にphone含む`replace`フィルタが保存時のデータフォーマットに問題がないか再確認。実際には`handleSave`が`editForm`をそのまま渡しているので動作するはず。保存後にキャッシュが`ext-companies`に正しくinvalidateされている。→ 再度テスト、問題があればログ確認

### 3. 案件編集の保存ができない
**レポート:** 案件編集の保存ができない  
**原因調査:** `AdminCampaignDetail.tsx`の`handleSave`は`editForm`全体を渡す。`editForm`にはステータスが含まれ、`update_campaign`は空文字→null変換済み。→ Edge Functionの`update_campaign`にフィールドのクリーニングが不十分な可能性（`deliverables`, `requirements`フィールドなど空文字のまま渡してエラー）。修正: Edge Functionでtext系フィールドの空文字もnull変換

### 4. 新規企業登録で業種・電話番号が反映されない
**レポート:** 業種や電話番号、webサイトを入力して登録→詳細で反映されていない  
**原因:** `register-client`で会社作成後、`admin-manage-data`の`update_company`で追加情報を更新するが、タイミングの問題で`companies`テーブルにまだレコードがない可能性。`maybeSingle()`でnullが返る。修正: 短いdelayまたはリトライロジック追加、またはregister-client Edge Functionで直接追加フィールドを受けてcompanyレコード作成時に含める

### 5. インフルエンサーのステータス変更が保存前に適用される
**レポート:** ステータス変更ボタンを押した時点でDBに反映される  
**確認:** `AdminInfluencerDetail.tsx`では`pendingStatus`をeditFormに保持し、保存ボタンでまとめて更新する設計になっている。→ 既に対応済みの可能性があるが、再確認

### 6. ダッシュボード「登録IF数」→「登録インフルエンサー数」
**レポート:** 表記変更  
**確認:** 現在のコードは「登録インフルエンサー数」になっている → **既に対応済み**

### 7. ご利用の流れのアイコン丸の色が薄い
**レポート:** 背景と同化して見づらい  
**確認:** 現在 `bg-gradient-to-br from-pink-500 to-purple-600` → **既に対応済み**（濃い色に変更済み）

### 8. POINT01・02・03の文字の色が薄い
**レポート:** FeaturesSection の色が薄い  
**確認:** 現在 `text-primary/80` → 修正: `text-primary` に変更（不透明度を削除してもう少し濃く）

### 9. FVの「掲載希望の企業さまはこちら」リンク先変更
**レポート:** `https://pr-izm.com/gifting` に変更  
**確認:** 現在のコードは既に `https://pr-izm.com/gifting` → **既に対応済み**  
**追加レポート:** `https://pr-izm.com/casting` に変更  
→ 古いレポートと新しいレポートで矛盾。最新のものは `casting`。修正: `gifting` → `casting` に変更

### 10. スマホからLINEログインでエラー
**レポート:** エラーになる  
**分析:** LINE OAuth callbackの問題。`LineCallback.tsx`を確認する必要あり。→ 別途調査が必要（Edge Function `line-auth`とcallback処理の確認）

### 11. 都道府県フィルター追加（企業案件登録）
**レポート:** 案件に都道府県選択欄を追加  
**修正:** `ClientCampaignNew.tsx`に都道府県プルダウン追加、campaignsテーブルに`prefecture`カラムがなければ追加

---

## 技術的な修正内容

### A. 電話番号バリデーションユーティリティ作成
`src/lib/utils.ts`に共通バリデーション関数を追加:
```typescript
export function isValidPhone(phone: string): boolean {
  return /^[\d\-+()]{10,15}$/.test(phone);
}
```

### B. 各フォームへのバリデーション適用
保存ボタン押下時に電話番号が入力されている場合、バリデーションチェックし、不正なら`toast.error("正しい電話番号を入力してください")`を表示して保存中止

### C. Edge Function修正
- `register-client`: `phone`, `industry`, `website`, `description`をEdge Function内で直接companyレコード更新できるように改善（company作成のトリガー完了後に更新）
- `admin-manage-data`: `update_campaign`で`requirements`/`deliverables`/`description`の空文字→null変換追加

### D. FeaturesSection色修正
`text-primary/80` → `text-primary font-bold`

### E. HeroSection リンク変更
`https://pr-izm.com/gifting` → `https://pr-izm.com/casting`

### F. 案件に都道府県フィールド追加
- DB: `campaigns`テーブルに`prefecture`カラム追加（nullable text）
- `ClientCampaignNew.tsx`: 都道府県プルダウン追加
- 案件詳細/編集ページにも表示・編集追加

### G. LINE認証エラー調査
`line-auth` Edge Function と `LineCallback.tsx` のフロー確認・修正

---

## 修正ファイル一覧
1. `src/lib/utils.ts` — バリデーション関数追加
2. `src/pages/admin/AdminClientDetail.tsx` — 電話バリデーション追加
3. `src/pages/admin/AdminClients.tsx` — 新規登録時の電話バリデーション + 追加フィールド反映修正
4. `src/pages/client/ClientSettings.tsx` — 電話バリデーション追加
5. `src/pages/mypage/MyPageSettings.tsx` — 電話バリデーション追加
6. `src/components/home/FeaturesSection.tsx` — Point色を濃く
7. `src/components/home/HeroSection.tsx` — リンク先をcastingに変更
8. `supabase/functions/register-client/index.ts` — 追加フィールド対応
9. `supabase/functions/admin-manage-data/index.ts` — update_campaignの空文字null変換拡充
10. DB migration — campaignsにprefectureカラム追加
11. `src/pages/client/ClientCampaignNew.tsx` — 都道府県プルダウン追加
12. `src/pages/admin/AdminCampaignDetail.tsx` — 都道府県表示・編集追加
13. LINE認証関連ファイル（調査後に特定）

