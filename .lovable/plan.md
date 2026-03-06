

## 問題の根本原因

**ブラウザコンテキストの切り替わり**が原因です。

iPhoneでの新規登録フロー:
1. ユーザーがSafari等（ブラウザA）で `app.pr-izm.com` を開く
2. 友だち追加 → プロフィール入力 → `localStorage.pendingRegistration` をセット（ブラウザAのlocalStorage）
3. LINE OAuthへリダイレクト → LINEアプリが開く
4. LINE OAuth完了 → コールバックURLが**LINE内ブラウザ（ブラウザB）**で開かれる
5. ブラウザBのlocalStorageには `pendingRegistration` が**存在しない**（別ブラウザ）
6. `LineCallback.tsx` 46行目: `data.isNewUser && !pendingReg` → **true** → `/auth/register/add-friend` へリダイレクト → **ループ**

`sessionStorage` → `localStorage` に変更しても、**ブラウザ自体が異なる**ため解決しません。これがsessionStorage時代から一貫して同じ問題が起き続けている理由です。

## 修正方針

LINE OAuth後にLINE内ブラウザで戻ってきた時点で、`lineProfile` はそのブラウザのlocalStorageに保存されます（LineCallback.tsx 52行目）。つまり、**2回目のOAuthは不要**です。

`RegisterProfile.tsx` を修正して:
- localStorageに `lineProfile` が既にある場合 → LINE OAuthをスキップし、直接 `register-influencer` Edge Functionを呼び出して登録完了
- `lineProfile` がない場合のみ → 従来通りLINE OAuthへリダイレクト（フォールバック）

```text
【修正後のフロー（iPhone + LINE内ブラウザ）】

Safari: /auth/login → "新規登録"
  ↓
Safari: /auth/register/add-friend → 友だち追加 → 次へ
  ↓
Safari: /auth/register/profile → フォーム入力 → 登録完了
  ↓ (pendingRegistration セット → LINE OAuthへ)
  ↓
LINE OAuth → LINE内ブラウザで /auth/line/callback
  ↓ (isNewUser=true, pendingReg=null)
  ↓ lineProfile を localStorage に保存
  ↓
LINE内ブラウザ: /auth/register/add-friend → 友だち追加確認 → 次へ
  ↓
LINE内ブラウザ: /auth/register/profile → フォーム入力 → 登録完了
  ↓ ★ lineProfile が存在するのでOAuthスキップ
  ↓ → 直接 register-influencer を呼び出し
  ↓
LINE内ブラウザ: /mypage ✅ 完了!
```

## 変更対象ファイル

### 1. `src/pages/auth/RegisterProfile.tsx`
- `handleSubmit` を大幅修正
- localStorageから `lineProfile` をチェック
- 存在する場合: `register-influencer` Edge Functionを直接呼び出し → 成功したら `currentUser` をセットして `/mypage` へ遷移
- 存在しない場合: 従来通りLINE OAuthへリダイレクト（初回フロー）

### 2. 変更不要なファイル
- `LineCallback.tsx` — 現状のロジックで正しい（新規ユーザー+pendingRegなし → lineProfile保存 → add-friendへ）
- `LineAddFriend.tsx` — 変更不要
- `Login.tsx` — 変更不要
- Edge Functions — 変更不要

## 技術詳細

`RegisterProfile.handleSubmit()` の新しいロジック:

```typescript
const handleSubmit = async () => {
  // 1. Check if lineProfile exists (means user already went through OAuth)
  const savedProfile = localStorage.getItem("lineProfile");

  if (savedProfile) {
    // Direct registration - no OAuth needed
    const lineProfile = JSON.parse(savedProfile);
    const response = await fetch(register-influencer, { ... });
    // On success → set currentUser → navigate /mypage
    // On failure → show error
  } else {
    // First-time flow - need OAuth
    localStorage.setItem("pendingRegistration", profileData);
    window.location.href = buildLineOAuthUrl("aggressive");
  }
};
```

これにより、LINE内ブラウザでの2回目のプロフィール入力時にOAuthリダイレクトが発生せず、ループが完全に解消されます。

