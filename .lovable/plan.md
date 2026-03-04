

## 修正内容

企業側（`ClientSidebar`）とインフルエンサー側（`InfluencerSidebar`）のサイドバー下部に、お問い合わせセクションを追加します。

### 追加する表示内容
- 「お問い合わせ」ラベル + メールアイコン
- 「24時間受付（返信: 2〜3営業日）」
- `media@pr-izm.com`（mailto リンク）

### 変更ファイル

**1. `src/components/client/ClientSidebar.tsx`**
- `mt-auto` の下部セクション内、設定リンクの上にお問い合わせ情報を追加

**2. `src/components/layout/InfluencerSidebar.tsx`**
- `mt-auto` の下部セクション内、ログアウトボタンの上にお問い合わせ情報を追加

両方とも同じデザイン: 小さなカード風のブロックにメールアイコン、受付時間、メールアドレスを表示。`border-t` の区切り線の上に配置します。

