
# 9項目の機能改善・追加プラン

## 概要
インフルエンサー管理画面、事務局管理画面、企業管理画面にわたる9つの改善要件を実装します。

---

## 1. インフルエンサー管理画面：ジャンルを登録フォームと統一

**現状**: 事務局のインフルエンサー編集画面のカテゴリは `constants.ts` の `CATEGORIES`（スキンケア、メイクなど美容系中心）を使用。一方、登録フォーム（`RegisterProfile.tsx`）では「ダンス、Vlog、美容・コスメ、動物」など別のジャンルリストを使用。

**対応内容**:
- `constants.ts` に `GENRES` 定数を追加（登録フォームと同じリスト）
- `RegisterProfile.tsx` をこの共通定数に切り替え
- 事務局のインフルエンサー編集モーダル（`AdminInfluencers.tsx`）のカテゴリ選択を、単一ドロップダウンから複数選択チップ形式に変更（登録時と同じUI）
- インフルエンサー設定画面（`MyPageSettings.tsx`）の活動情報タブも同じジャンルリストに更新

---

## 2. SNS URLフィールドの追加（X含む）

**現状**: `influencer_profiles` テーブルにはフォロワー数カラムのみ。URLフィールドが存在しない。

**対応内容**:
- **DB変更**: `influencer_profiles` に以下のカラムを追加
  - `instagram_url` (text)
  - `tiktok_url` (text)
  - `youtube_url` (text)
  - `twitter_url` (text) ※ X用
- 事務局のインフルエンサー編集モーダルにURL入力フィールドを追加
- インフルエンサー設定画面のSNSタブにURL入力フィールドを追加
- 登録フォームにもSNS URLの任意入力欄を追加

---

## 3. 事務局からのインフルエンサー承認 + 未承認時の制限画面

**現状**: 承認ボタンは `AdminInfluencers.tsx` に存在するが、インフルエンサー側には承認待ち状態の制限がない。

**対応内容**:
- インフルエンサーのマイページ（`MyPageLayout`）にステータスチェックを追加
- ステータスが `pending` の場合、案件一覧・応募・メッセージなどの機能ページの代わりに「承認待ち画面」を表示
  - 「現在事務局にて審査中です。承認されるまで少々お待ちください。」というメッセージ
  - ダッシュボードとプロフィール設定のみアクセス可能に
- 事務局の承認処理が正常に動作するよう確認（既存コードで問題なし）

---

## 4. ダッシュボードのKPIカードからリンク設定

**現状**: 事務局ダッシュボードでは「稼働中案件」「登録企業」「登録IF」はリンクあり。企業・IFダッシュボードではリンクなし。

**対応内容**:
- **事務局ダッシュボード** (`AdminDashboard.tsx`): 「総応募数」カードを `/admin/applications` にリンク（項目6と統合）
- **企業ダッシュボード** (`ClientDashboard.tsx`): 各KPIカードにリンクを追加
  - 稼働中案件 → `/client/campaigns`
  - 選考中の応募 → `/client/applicants`
  - 採用済み → `/client/applicants`
  - 未読メッセージ → `/client/messages`
- **インフルエンサーダッシュボード** (`MyPageDashboard.tsx`): 各KPIカードにリンクを追加
  - 選考中の案件 → `/mypage/applications`
  - 採用済み → `/mypage/applications`
  - 完了案件 → `/mypage/applications`
  - 未読メッセージ → `/mypage/messages`

---

## 5. 企業ロゴ画像の登録 + 案件画面でのアイコン表示

**現状**: `companies` テーブルに `logo_url` カラムは存在するが、企業設定画面に画像アップロード機能がない。

**対応内容**:
- `ClientSettings.tsx` にロゴ画像アップロード機能を追加
  - `campaign-images` バケットを共用（または専用バケット作成）
  - アップロード後、`companies.logo_url` に保存
- 案件一覧画面（`MyPageCampaigns.tsx`、`Campaigns.tsx`）の企業名横に企業ロゴアイコンを表示
- スレッドの企業名表示部分にもロゴアイコンを反映

---

## 6. 事務局ダッシュボード「総応募数」のリンク化

項目4に統合。「総応募数」カードをクリックで `/admin/applications` に遷移するよう `Link` で囲む。

---

## 7. 事務局ダッシュボードの統計グラフ・フィルター強化

**現状**: 月間マッチング数、選考中案件、完了案件がシンプルなカード表示のみ。

**対応内容**:
- `recharts` ライブラリ（既にインストール済み）を使用してグラフを追加
  - 月別応募数・マッチング数の棒グラフ
  - ステータス別の円グラフ
- フィルター機能の追加
  - 期間フィルター（日付範囲）
  - ステータスフィルター
  - カテゴリフィルター
- KPIカード下部にグラフセクションを新設

---

## 8. 全ページのレスポンシブ対応

**対応内容**:
- 事務局のテーブル表示をモバイルではカード形式に切り替え
- モーダルのモバイル対応（フルスクリーン化）
- ダッシュボードのグリッドレイアウト調整
- サイドバーのモバイル対応確認
- フィルターセクションのモバイル対応（折りたたみ式）

---

## 9. コミュニケーション構造の変更：事務局仲介型

**現状**: 企業とインフルエンサーが直接スレッドでやり取り可能。

**対応内容**:
- **メッセージフロー変更**: 企業 ↔ 事務局 ↔ インフルエンサーの三者構造に
  - 企業がメッセージを送る → 事務局に届く → 事務局がインフルエンサーに転送/連絡
  - インフルエンサーがメッセージを送る → 事務局に届く → 事務局が企業に転送/連絡
- **スレッド変更**: `ThreadConversation` を修正
  - 企業・IFからの直接メッセージ送信を無効化
  - ステータスの進行のみ操作可能に（ステータス管理UIに変更）
  - 投稿報告・振込先情報などの自動メッセージは維持
- **事務局メッセージ管理画面** (`AdminMessages.tsx`) を強化
  - 全スレッドの監視機能（既存）
  - 各スレッドに対して企業・IF双方にメッセージを送信できるUI
  - application_id ベースでスレッドを表示

---

## 技術的な実装順序

1. DB変更（SNS URLカラム追加）
2. 定数ファイル更新（ジャンル統一）
3. インフルエンサー承認制限の実装
4. ダッシュボードのリンク化 + グラフ追加
5. 企業ロゴアップロード機能
6. コミュニケーション構造の変更
7. レスポンシブ対応（全体に適用）

## DB変更が必要な箇所

```sql
ALTER TABLE influencer_profiles
  ADD COLUMN instagram_url text,
  ADD COLUMN tiktok_url text,
  ADD COLUMN youtube_url text,
  ADD COLUMN twitter_url text;
```

## 影響ファイル一覧

- `src/lib/constants.ts` - ジャンル定数追加
- `src/pages/auth/RegisterProfile.tsx` - ジャンル統一
- `src/pages/admin/AdminInfluencers.tsx` - ジャンル・URL・承認
- `src/pages/admin/AdminDashboard.tsx` - リンク・グラフ追加
- `src/pages/admin/AdminMessages.tsx` - 仲介型メッセージUI
- `src/pages/client/ClientDashboard.tsx` - リンク追加
- `src/pages/client/ClientSettings.tsx` - ロゴアップロード
- `src/pages/mypage/MyPageDashboard.tsx` - リンク追加
- `src/pages/mypage/MyPageSettings.tsx` - ジャンル・URL統一
- `src/pages/mypage/MyPageCampaigns.tsx` - 企業ロゴ表示
- `src/components/ThreadConversation.tsx` - ステータス管理型に変更
- `src/components/layout/MyPageLayout.tsx` - 承認チェック追加
- `src/hooks/useExternalInfluencers.ts` - URLフィールド追加
- 新規: 統計グラフコンポーネント
