
# 案件管理・スレッド機能の大幅改修プラン

## 概要

案件スレッドのコミュニケーション構造を、メッセージの可視性制御・複数投稿報告・企業からの修正指示・事務局仲介を含む本格的な案件管理システムに改修します。

---

## 1. 「メッセージ」から「案件管理」への名称変更 + フィルター追加

**変更対象**: `ClientMessages.tsx`, `MyPageMessages.tsx`, サイドバー

- ページタイトルを「メッセージ」→「案件管理」に変更
- フィルター機能を追加:
  - ステータス絞り込み（進行中、投稿済み、完了など）
  - カテゴリ絞り込み
  - 日付範囲絞り込み
  - テキスト検索（案件名）
- サイドバーのメニュー名も「案件管理」に変更

---

## 2. 画像アップロードの修正

**変更対象**: `ThreadConversation.tsx`, `send-thread-message/index.ts`

- インフルエンサー側の画像アップロードが失敗する原因を修正
- `send-thread-message` エッジファンクションで `senderProfileId` 使用時に正しく `senderId` / `receiverId` を設定
- ストレージバケット `thread-attachments` のアップロードパスを修正

---

## 3. 複数投稿報告 + 任意メッセージ対応

**変更対象**: `ThreadConversation.tsx`

- 投稿報告を1回限りではなく、`in_progress` ステータスの間は何回でも送信可能に
- 各投稿報告に任意のテキストメッセージを添付可能に
- 複数画像（スクリーンショット）のアップロード対応
- UIを「投稿報告#1」「投稿報告#2」のように識別表示

---

## 4. 企業からの修正指示（テキスト + 複数画像）

**変更対象**: `ThreadConversation.tsx`

- 企業側に「投稿を承認」だけでなく「修正依頼」ボタンを追加
- 修正依頼にはテキストメッセージ + 複数画像添付が可能
- ステータスを `revision_requested`（修正中）に変更可能に

---

## 5. 「修正中」ステータスの追加

**変更対象**: `constants.ts`, DB関連、`ThreadConversation.tsx`, `ClientApplicants.tsx`

- `APPLICATION_STATUSES` に `revision_requested`（修正中）を追加
- ステータスフロー: `post_submitted` → 企業が修正依頼 → `revision_requested` → IF が再投稿 → `post_submitted`
- 既存の `STATUS_FLOW` マッピングを更新

更新後のステータスフロー:
```
approved → in_progress → post_submitted → (post_confirmed or revision_requested)
revision_requested → post_submitted（再投稿）
post_confirmed → payment_pending → completed
```

---

## 6. 事務局の同一スレッド閲覧 + メッセージ可視性制御

**変更対象**: DB（messages テーブル）、`AdminMessages.tsx`、`send-thread-message/index.ts`、`get-thread-messages/index.ts`、`ThreadConversation.tsx`

### DB変更
`messages` テーブルに `visibility` カラムを追加:
- `all`: 全員に見える（デフォルト）
- `admin_company`: 事務局と企業のみ見える
- `admin_influencer`: 事務局とインフルエンサーのみ見える

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'all';
```

### メッセージ可視性ルール
- 事務局 → 全スレッドの全メッセージが見える
- 企業がメッセージ送信 → 事務局宛で `visibility = 'admin_company'`（IFには見えない）
- IF がメッセージ送信 → 事務局宛で `visibility = 'admin_influencer'`（企業には見えない）
- 事務局が送信 → 宛先（企業 or IF）に応じて適切な `visibility` を設定
- ステータス更新メッセージ・投稿報告 → `visibility = 'all'`

### AdminMessages の改修
- 現在の旧メッセージ管理画面を、application_id ベースのスレッド一覧に変更
- 各スレッドを開くと `ThreadConversation` と同じUIを表示（ただし `userType = 'admin'`）
- 事務局は企業宛・IF宛を選んでメッセージ送信可能

### ThreadConversation の改修
- `userType` に `'admin'` を追加
- 表示時に `visibility` フィルタリング:
  - company: `all` と `admin_company` のみ表示
  - influencer: `all` と `admin_influencer` のみ表示
  - admin: 全て表示
- 企業・IF のメッセージ送信先を事務局のみに制限
- 事務局は送信先（企業 or IF）を選択して送信

---

## 7. 応募者詳細でインフルエンサーのSNS URL表示

**変更対象**: `ClientApplicants.tsx`, `useExternalApplications.ts`

- `useExternalApplications` の select クエリに SNS URL フィールドを追加
- 応募者詳細モーダルおよび応募者カードにSNS URLリンクを表示
- Instagram, TikTok, YouTube, X のアイコン付きリンクとして表示

---

## 技術的な実装詳細

### DB マイグレーション

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'all';
```

### ステータス定数の更新

```typescript
// constants.ts に追加
{ id: "revision_requested", label: "修正中", color: "bg-amber-100 text-amber-700" }
```

### ステータスフロー更新

```typescript
const STATUS_FLOW = {
  approved: "in_progress",
  in_progress: "post_submitted",
  post_submitted: "post_confirmed",      // 企業承認
  // post_submitted → revision_requested は別アクション
  revision_requested: "post_submitted",   // IF再投稿
  post_confirmed: "payment_pending",
  payment_pending: "completed",
};
```

### エッジファンクション変更

- `send-thread-message`: `visibility` パラメータ対応、`targetType`（admin宛先選択）対応
- `get-thread-messages`: レスポンスに `visibility` を含める（フィルタはフロントで実施）

### 影響ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/constants.ts` | `revision_requested` ステータス追加 |
| `src/components/ThreadConversation.tsx` | 全面改修：可視性制御、複数投稿報告、修正依頼、admin対応、複数画像 |
| `src/pages/client/ClientMessages.tsx` | 案件管理に改名、フィルター追加 |
| `src/pages/mypage/MyPageMessages.tsx` | 案件管理に改名、フィルター追加 |
| `src/pages/admin/AdminMessages.tsx` | application_idベースのスレッド一覧に全面改修 |
| `src/hooks/useExternalApplications.ts` | SNS URL フィールド追加 |
| `src/pages/client/ClientApplicants.tsx` | SNS URL 表示追加 |
| `src/components/client/ClientSidebar.tsx` | メニュー名変更 |
| `src/components/layout/InfluencerSidebar.tsx` | メニュー名変更 |
| `supabase/functions/send-thread-message/index.ts` | visibility 対応 |
| `supabase/functions/get-thread-messages/index.ts` | visibility 含めて返却 |
| DB マイグレーション | messages に visibility カラム追加 |

### 実装順序

1. DB マイグレーション（visibility カラム追加）
2. constants.ts 更新（revision_requested 追加）
3. エッジファンクション更新（send-thread-message, get-thread-messages）
4. ThreadConversation 全面改修
5. ClientMessages / MyPageMessages の案件管理化
6. AdminMessages の改修
7. ClientApplicants への SNS URL 表示追加
