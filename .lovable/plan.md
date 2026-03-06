

## 概要

右下のバグレポート用フローティングボタンを一時的に非表示にし、事務局の管理画面（バグレポート管理ページ）からON/OFFを切り替えられるようにします。

## 実装方針

DBに `app_settings` テーブルを作成し、`debug_button_enabled` フラグを管理。フローティングボタン表示時にこの設定を取得し、OFFなら非表示にします。

## 変更内容

### 1. DBマイグレーション
- `app_settings` テーブル作成（key TEXT PRIMARY KEY, value JSONB）
- 初期値として `debug_button_enabled: false` を挿入
- RLS: 全ユーザーがSELECT可能、UPDATE/INSERTは `admin-manage-data` Edge Function経由（service role）

### 2. Edge Function: `admin-manage-data`
- `get_app_setting` アクション追加（keyで設定値を取得）
- `update_app_setting` アクション追加（keyで設定値を更新）

### 3. `src/components/debug/DebugFloatingButton.tsx`
- マウント時に `app_settings` テーブルから `debug_button_enabled` を取得
- `false` の場合はボタンを一切レンダリングしない

### 4. `src/pages/DebugReportsPage.tsx`
- ページ上部にON/OFFスイッチを追加
- `update_app_setting` を呼び出してトグル
- 現在の状態を表示（「バグ報告ボタン: 非表示中 / 表示中」）

### 5. `src/hooks/useAdminData.ts`
- `useAppSetting(key)` フック追加
- `useAdminUpdateAppSetting()` ミューテーション追加

