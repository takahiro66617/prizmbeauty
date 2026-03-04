

## 修正内容

現在、新規ユーザーが「LINEでログイン」を押した場合、LINE認証後に `isNewUser=true` かつ `pendingRegistration` なしの状態になり、129-137行目でそのまま `/auth/register/profile` に飛ばしています。

これを `/auth/register/add-friend`（友だち追加画面）にリダイレクトするよう変更します。LINE profileはsessionStorageに保存しておき、友だち追加画面から正規フローに合流させます。

### 変更ファイル: `src/pages/auth/LineCallback.tsx`

129-137行目の「新規ユーザー・pendingRegistrationなし」ケースを変更:
- 遷移先を `/auth/register/profile` → `/auth/register/add-friend` に変更
- `lineProfile` と `lineFriendAdded` をsessionStorageに保存（友だち追加画面→プロフィール画面で利用）

これにより、新規ユーザーが誤って「ログイン」ボタンを押しても、友だち追加画面に案内され、正規の登録フロー（友だち追加→プロフィール入力→LINE認証→完了）に合流できます。

