
# 3つの管理画面の連携実装計画

3種類のダッシュボード（インフルエンサー、企業、管理者）を構築し、共有データで連携させます。

---

## 現状

| ダッシュボード | 状態 | パス |
|-------------|------|------|
| インフルエンサー用 | 実装済み | `/mypage/*` |
| 管理者用（事務局） | 実装済み | `/admin/*` |
| 企業用 | 未実装 | なし |

---

## 実装内容

### 1. 共有モックデータの拡充（mockData.ts）

3つの画面が同じデータを参照して連携できるよう、以下を追加:

- **MOCK_COMPANIES**: 企業の詳細情報（担当者、連絡先、ステータス）
- **MOCK_INFLUENCERS**: インフルエンサー一覧（SNS情報、ステータス）
- **MOCK_APPLICATIONS**: 応募データ（インフルエンサーID、案件ID、ステータス、応募日）
- **MOCK_MESSAGES**: メッセージデータ（送信者、受信者、内容）

これにより:
- インフルエンサーが応募 → 企業の応募一覧に表示 → 管理者が全体を監視
- 企業がスカウト → インフルエンサーに通知 → 管理者が確認可能

### 2. 企業用ダッシュボード（新規作成）

**ルート構成**: `/client/*`

| ページ | パス | 機能 |
|-------|------|------|
| ログイン | `/client/login` | メールアドレス＋パスワードでログイン |
| ダッシュボード | `/client/dashboard` | KPI（応募数/稼働案件/選考中）、TODO、お知らせ |
| 案件管理 | `/client/campaigns` | 自社案件一覧、ステータス管理 |
| 案件作成 | `/client/campaigns/new` | 案件の新規作成フォーム |
| 応募者管理 | `/client/applicants` | 応募インフルエンサー一覧、承認/却下操作 |
| メッセージ | `/client/messages` | インフルエンサーとのやり取り |
| 設定 | `/client/settings` | 企業情報の編集 |

**レイアウト**: 管理者画面と同様のサイドバー構成（青系カラーで差別化）

### 3. 管理者ダッシュボードの強化

既存の管理者画面を拡張して、全体を監視できるようにする:

- **ダッシュボード**: インフルエンサー総数、企業総数、応募総数、月間マッチング数のKPI
- **案件管理**: 全企業の案件を横断表示、ステータス変更機能
- **企業管理**: 企業アカウントの有効/無効切り替え、詳細表示
- **インフルエンサー管理**: 審査ステータス（審査中/承認/停止）の変更機能
- **応募管理（新規）**: 全応募の横断一覧、マッチング状況の確認

### 4. インフルエンサー画面の連携強化

既存の `/mypage` 画面に企業データとの連携を追加:

- **応募履歴**: MOCK_APPLICATIONS から自分の応募を表示、ステータスがリアルタイム反映
- **メッセージ**: 企業からのメッセージを受信表示
- **お知らせ**: スカウト通知、応募結果通知を表示

### 5. ルーティング更新（App.tsx）

```text
/client/login         → 企業ログイン
/client               → ClientLayout（サイドバー付き）
  /client/dashboard   → 企業ダッシュボード
  /client/campaigns   → 自社案件一覧
  /client/campaigns/new → 案件作成
  /client/applicants  → 応募者管理
  /client/messages    → メッセージ
  /client/settings    → 企業設定
```

---

## データ連携の流れ

```text
[インフルエンサー]          [企業]                [管理者]
案件に応募 ───────────→ 応募一覧に表示 ─────→ 全応募を監視
     ↑                承認/却下 ──────────→ マッチング統計
応募結果通知 ←──────── スカウト送信         全ユーザー管理
メッセージ受信 ←───→ メッセージ送信        企業/IF承認管理
```

---

## 新規作成ファイル

- `src/components/client/ClientLayout.tsx` - 企業用レイアウト
- `src/components/client/ClientSidebar.tsx` - 企業用サイドバー
- `src/pages/client/ClientLogin.tsx` - 企業ログイン
- `src/pages/client/ClientDashboard.tsx` - 企業ダッシュボード
- `src/pages/client/ClientCampaigns.tsx` - 案件管理
- `src/pages/client/ClientCampaignNew.tsx` - 案件作成
- `src/pages/client/ClientApplicants.tsx` - 応募者管理
- `src/pages/client/ClientMessages.tsx` - メッセージ
- `src/pages/client/ClientSettings.tsx` - 企業設定

## 更新ファイル

- `src/lib/mockData.ts` - 共有データ追加
- `src/App.tsx` - 企業用ルーティング追加
- `src/pages/admin/AdminDashboard.tsx` - KPI強化
- `src/pages/admin/AdminClients.tsx` - 企業詳細・ステータス管理
- `src/pages/admin/AdminInfluencers.tsx` - 審査管理機能
- `src/pages/mypage/MyPageDashboard.tsx` - 連携データ表示
- `src/pages/mypage/MyPageApplications.tsx` - MOCK_APPLICATIONSとの連携
- `src/pages/mypage/MyPageMessages.tsx` - メッセージ表示
- `src/pages/mypage/MyPageNotifications.tsx` - 通知表示
- `src/components/admin/AdminSidebar.tsx` - 応募管理リンク追加
