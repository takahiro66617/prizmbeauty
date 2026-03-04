

## 問題の理解

現在「次へ進む（LINE認証）」ボタンを押すとLINE OAuth画面に飛ぶが、ユーザーはこのボタンで**PRizmのプロフィール登録画面**に遷移してほしい。

## フロー変更

```text
現在:  友だち追加 → LINE OAuth → プロフィール登録
変更後: 友だち追加 → プロフィール登録 → LINE OAuth → 完了
```

## 実装方針

LINE認証はユーザーIDの取得に必須なため、プロフィール入力の**後**に移動する。

### 1. `src/pages/auth/LineAddFriend.tsx`
- 「次へ進む」ボタンで `/auth/register/profile` に `navigate()` する（LINE OAuthではなく）
- ボタンテキストを「次へ進む」に変更、説明文も「プロフィールを入力します」に変更

### 2. `src/pages/auth/RegisterProfile.tsx`
- `lineProfile` が無くても表示できるように変更（useEffectのリダイレクト削除）
- 「登録を完了する」ボタン押下時に、入力データを `sessionStorage` に保存してからLINE OAuthへリダイレクト
- LINE認証は登録の最終ステップとして裏で実行される形に

### 3. `src/pages/auth/LineCallback.tsx`
- コールバック処理で `sessionStorage` に保存されたプロフィールデータを検出
- プロフィールデータがある場合、LINE profileと合わせて `register-influencer` を呼び出し、登録完了後に `/mypage` へ遷移
- プロフィールデータがない場合は既存フロー（既存ユーザーログイン）を維持

### 修正ファイル
- `src/pages/auth/LineAddFriend.tsx`
- `src/pages/auth/RegisterProfile.tsx`
- `src/pages/auth/LineCallback.tsx`

