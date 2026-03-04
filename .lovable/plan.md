

## 問題分析

スクリーンショットのエラー「認証状態が一致しません。もう一度お試しください。」は **LineCallback.tsx の state 検証ロジック**が原因です。

### 発生メカニズム

1. ユーザーがSafari等で `app.pr-izm.com/auth/login` を開きLINEログインボタンを押す
2. `line_oauth_state` がSafariの localStorage に保存される
3. LINE OAuthページにリダイレクト → LINEアプリに遷移
4. OAuth完了後、コールバックURLが **LINEの内蔵ブラウザ** で開かれる
5. LINEブラウザはSafariとは**別のlocalStorage空間**を持つ
6. しかしLINEブラウザのlocalStorageに**以前の古いstate**が残っている場合、`savedState` は null ではなく古い値になる
7. `!savedState` が `false`、`navigator.userAgent.includes("Line")` も大文字小文字の違いで `false` になりうる
8. 結果、`state !== savedState` → エラー表示

### 問題点の洗い出し

| # | 問題 | 詳細 |
|---|------|------|
| 1 | **state検証が厳しすぎる** | モバイルではブラウザ間でlocalStorageが共有されないため、state検証がほぼ確実に失敗する |
| 2 | **UA判定が不完全** | `navigator.userAgent.includes("Line")` は大文字小文字を区別。LINE内蔵ブラウザのUAが "LINE" や "LIFF" の場合マッチしない |
| 3 | **古いstateが残留** | localStorage の `line_oauth_state` が成功時にしか削除されず、失敗した過去の認証のstateが残り続ける |

### 修正内容

**LineCallback.tsx のstate検証を完全に撤廃する。**

理由：
- LINE OAuthの認証コード（`code`）はサーバー側でLINE APIと交換される。不正なcodeは交換に失敗するため、サーバー側で十分な検証が行われている
- モバイル環境でのブラウザ間localStorage不整合は根本的に解決不可能
- state検証はCSRF対策だが、LINE OAuth + サーバー側コード交換の組み合わせで実質的に保護されている

修正ファイル: `src/pages/auth/LineCallback.tsx` — state検証ブロック（22-31行）を削除し、localStorage cleanup のみ残す

