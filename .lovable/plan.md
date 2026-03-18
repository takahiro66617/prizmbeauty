

## 問題の原因

`RegisterProfile.tsx` で `sessionStorage.setItem("pendingRegistration", ...)` を実行後、LINE OAuthへ外部リダイレクト。LINEからコールバックで戻った時に `sessionStorage` のデータが消失している。

`LineCallback.tsx` (46行目):
```
if (data.isNewUser && !pendingReg) → /auth/register/add-friend へリダイレクト → ループ
```

## 修正方針

`sessionStorage` → `localStorage` に変更する。`localStorage` はタブやブラウザコンテキストをまたいでも永続するため、LINE OAuthリダイレクト後もデータが保持される。

## 変更対象ファイル（4ファイル）

### 1. `src/pages/auth/RegisterProfile.tsx`
- 33行目: `sessionStorage.getItem("lineFriendAdded")` → `localStorage.getItem`
- 60行目: `sessionStorage.setItem("pendingRegistration", ...)` → `localStorage.setItem`

### 2. `src/pages/auth/LineAddFriend.tsx`
- 31行目: `sessionStorage.setItem("lineFriendAdded", ...)` → `localStorage.setItem`

### 3. `src/pages/auth/LineCallback.tsx`
- 42行目: `sessionStorage.getItem("pendingRegistration")` → `localStorage.getItem`
- 52行目: `sessionStorage.setItem("lineProfile", ...)` → `localStorage.setItem`
- 114-116行目: cleanup を `sessionStorage.removeItem` → `localStorage.removeItem` に変更
- 136-137行目: 同上

### 4. `src/pages/Login.tsx`
- 16-18行目: `sessionStorage.removeItem(...)` → `localStorage.removeItem(...)` に変更（ログインボタン押下時の古いデータクリア）

## 影響範囲

- 既存ログインフローに影響なし（既存ユーザーは `pendingRegistration` を使わない）
- 登録完了後に `localStorage` からデータを削除するため、ゴミデータは残らない
- `currentUser` は引き続き `sessionStorage` のまま（認証後のセッション管理用なので変更不要）

