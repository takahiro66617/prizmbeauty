

## バグレポート管理機能 実装計画

### 1. データベースマイグレーション
- `debug_reports` テーブル作成（仕様書通りのスキーマ）
- RLSポリシー設定：INSERT は誰でも可、SELECT は認証ユーザー、ALL は admin ロール
- `debug-screenshots` ストレージバケット作成（public）
- ストレージRLSポリシー（誰でもアップロード可、公開読み取り）

### 2. 新規ファイル作成

| ファイル | 内容 |
|---|---|
| `src/components/debug/DebugModeProvider.tsx` | Context + ログ収集エンジン（console.error/warn フック、fetch モンキーパッチ、click/navigation インターセプト） |
| `src/components/debug/DebugFloatingButton.tsx` | 右下FAB（Portal使用、z-index最大値）。非アクティブ時は再生アイコン、アクティブ時は赤パルス停止ボタン+エラーバッジ |
| `src/components/debug/DebugReportModal.tsx` | 送信ダイアログ。html2canvasでスクリーンショット、画像アップロード、コメント入力、セッション情報表示、debug_reportsへINSERT |
| `src/components/debug/DebugModeWrapper.tsx` | Provider + FloatingButton をまとめるラッパー |
| `src/pages/DebugReportsPage.tsx` | 管理者向けレポート一覧・詳細。ステータスフィルター、インラインステータス変更、詳細ダイアログ（ログJSON表示） |

### 3. 依存ライブラリ追加
- `html2canvas` ^1.4.1

### 4. 既存ファイル修正

**`src/App.tsx`**:
- `DebugModeWrapper` でアプリ全体をラップ（BrowserRouter の内側）
- `/debug-reports` ルート追加

### 技術詳細

**ログ収集（DebugModeProvider）**:
- `console.error` / `console.warn` をオーバーライドしてログ配列に蓄積
- `window.fetch` をモンキーパッチしてリクエスト/レスポンス情報を記録
- `document.addEventListener("click", ..., true)` でクリックイベントをキャプチャフェーズで取得
- `history.pushState` / `replaceState` / `popstate` をインターセプト
- セッション停止時に全インターセプターを復元

**スクリーンショット（DebugReportModal）**:
- html2canvas でキャプチャ時、モーダルを一時非表示（300ms待機）→ キャプチャ → 再表示
- `debug-screenshots` バケットにアップロード後、公開URLを取得

**管理画面（DebugReportsPage）**:
- TanStack Query でレポート一覧取得
- ステータスフィルタータブ（すべて/未対応/対応中/解決済/対応不要）
- インラインでステータス変更（SELECT ドロップダウン）
- 詳細ダイアログでログをJSON整形表示（ScrollArea使用）

