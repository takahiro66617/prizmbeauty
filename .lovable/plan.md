
目的: 「トーク画面に遷移して戻れない」問題を根本解消し、友だち追加を必須のまま登録完了できるフローに一本化します。

1) なぜ現象が発生しているか（根本原因）
- 現在コードに `src/pages/auth/LineAddFriend.tsx` と `/auth/register/add-friend` ルートが残っており、ここで `https://line.me/R/ti/p/@616jfxwh`（深いリンク）を開く実装が存在します。
- この `line.me` 深いリンクはLINEアプリ（トーク画面）へ遷移しやすく、OS/LINEアプリ仕様上「遷移先アプリから元ブラウザへ強制で自動復帰」は保証できません。
- つまり「トークに行っても即ブラウザ復帰」をコードだけで100%保証するのは不可能です。
- さらに `LineCallback.tsx` では `lineFriendAdded=true` を無条件セットしており、友だち追加の実際の成否を判定していません。

2) 絶対に再発させない修正方針（採用すべき方式）
- 方針は「トーク画面に遷移させない」に統一します。
- 具体的には、`line.me` 深いリンク方式を廃止し、LINEログイン同意画面内の友だち追加（bot_prompt）だけを使います。
- そのうえで、バックエンドで友だち状態を検証し、未追加なら登録をブロックします（強制）。

3) 実装計画（変更対象と内容）
A. フロー一本化（フロント）
- `src/App.tsx`
  - `/auth/register/add-friend` を廃止（または安全なリダイレクトに変更）。
  - 旧URL直アクセス時も `line.me` を開かないようにする（`/auth/login`へ `replace` リダイレクト）。
- `src/pages/auth/LineAddFriend.tsx`
  - 実質不要化。削除または非利用化（将来再利用しない限り削除が安全）。

B. LINE認証URLの見直し（フロント）
- `src/pages/Login.tsx`
  - `bot_prompt=aggressive` を `bot_prompt=normal` に変更。
  - 理由: aggressiveは同意後に別画面を開く挙動があり、トーク導線を誘発しやすい。normalは同意画面内オプションで完結しやすい。
  - `line.me` への直接遷移は一切使わない。

C. 友だち追加の実際の成否をサーバーで判定（バックエンド）
- `supabase/functions/line-auth/index.ts`
  - アクセストークン取得後、`GET https://api.line.me/friendship/v1/status` を呼んで `friendFlag` を取得。
  - レスポンスに `friendFlag` を返す。
  - `LINE_CHANNEL_SECRET` 未設定時の明示エラーも追加し、障害時に原因を即特定できるようにする。

D. 未追加ユーザーを確実にブロック（フロント）
- `src/pages/auth/LineCallback.tsx`
  - `line-auth` の返却 `friendFlag` を判定。
  - `friendFlag === false` の場合:
    - プロフィール登録へ進ませない（必ず停止）。
    - 「友だち追加が完了していないため続行不可。LINEログインを再実行してください」を表示。
  - `friendFlag === true` の場合のみ `/auth/register/profile` へ遷移。
  - `sessionStorage.setItem("lineFriendAdded","true")` の無条件セットを削除（または friendFlag true時のみ）。

E. アイコン「？」再発防止
- `src/pages/Login.tsx` と必要なら関連箇所で、画像の `onError` フォールバックを state制御で実装（`innerHTML` 直接注入は使わない）。
- 公式アイコン/LINEアイコンは `public` または `src/assets` の確実な静的アセットに統一し、表示失敗時はテキストバッジを表示。

4) 技術詳細（重要）
- 「トークへ遷移しても即ブラウザに戻す」はモバイルOS仕様上、Webアプリ側で強制不可。
- 100%実現可能なのは「そもそもトーク遷移導線（line.me深いリンク）を使わない」方式。
- 友だち追加必須は `friendship/v1/status` 判定で担保するのが唯一の堅い方法。
- DBマイグレーションは不要（テーブル変更なし）。

5) 検証計画（徹底テスト）
- 新規ユーザー（未友だち）:
  - LINEログイン後、友だち未追加なら必ずブロックされること。
- 新規ユーザー（友だち追加済み）:
  - LINEログイン→コールバック→プロフィール登録へ直行すること。
- 既存ユーザー:
  - LINEログイン後に `/mypage` へ正常遷移すること。
- 旧URL:
  - `/auth/register/add-friend` へ直接アクセスしてもトークへ飛ばず、安全にログインへ戻ること。
- モバイル実機:
  - iOS Safari / Android Chrome でE2E確認（LINEアプリ連携含む）。

6) 完了条件
- `line.me/R/ti/p/@616jfxwh` を使うUI遷移がコード上から消えている。
- friendFlag未達成時は登録不可、達成時のみ登録可。
- 「トーク画面に飛んで戻れない」報告が再発しない。
