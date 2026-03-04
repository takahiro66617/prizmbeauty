
目的は「新規登録ボタン押下後、最初に“友だち追加画面（2枚目）”を必ず出す」ことです。  
現状コードを読む限り、1枚目になる理由は明確です。

## なぜ1枚目（access.line.meログイン画面）になるか
1. `src/pages/Login.tsx` でボタン押下時に**即座に** `https://access.line.me/oauth2/v2.1/authorize...` へ遷移している。  
   - つまり最初の遷移先が必ずLINE OAuth画面（access.line.me）。
2. 2枚目の画面（`/auth/register/add-friend`）は存在するが、現在フロー上ほぼ使われていない。  
   - `LineCallback.tsx` は新規ユーザーを `"/auth/register/profile"` へ直接送っている。
3. ユーザーがGmail/Safari等の外部ブラウザから開始すると、そのブラウザでLINE未ログインのため、メール/パスワード入力画面が出る。
4. `LINEでログイン / 新規登録` が1ボタンに統合されており、**新規登録専用フロー**が分離されていない。

---

## 問題点の全洗い出し（実装観点）
- 問題A: 新規登録フローの先頭がOAuth固定（UX要件と不一致）
- 問題B: 友だち追加画面コンポーネントが“死に導線”化（存在するのに入口がない）
- 問題C: ログインと新規登録が同一ボタンで、期待遷移を制御不能
- 問題D: 外部ブラウザ起点時の挙動説明がUI上に無く、「意味不明ページ」に見える
- 問題E: LINE側設定（Linked Bot）が未設定/不整合だと、OAuth同意画面の友だち追加導線が出ない
- 問題F: 定数/遷移ロジックが分散（`LINE_CHANNEL_ID`・OAuth URL組み立てが各所に散る）

---

## 修正方針（要件に合わせてフローを再設計）
要件どおり、**新規登録時のみ**以下に変更します。

```text
新規登録ボタン
  → /auth/register/add-friend（2枚目相当UI）
    → 「友だち追加しました→次へ」
      → LINE OAuth
        → /auth/line/callback
          → 新規: /auth/register/profile
          → 既存: /mypage
```

ログインは従来どおりOAuth直行を残し、既存ユーザー体験を壊しません。

---

## 実装計画（コード変更対象）
### 1) `src/pages/Login.tsx`
- 「LINEでログイン / 新規登録」を分離
  - `LINEでログイン` → 現行OAuth直行
  - `LINEで新規登録` → `/auth/register/add-friend?intent=signup`
- OAuth URL生成を共通関数化（重複排除）

### 2) `src/pages/auth/LineAddFriend.tsx`
- 事前認証モード（lineProfile未取得でも表示可能）に改修
- 2枚目画像に合わせた導線を正式フロー化
  - `友だち追加する`（line.meリンク）
  - `友だち追加しました→次へ`（OAuth開始）
- 友だち追加後に次へ進む前提の説明文を強化（誤操作防止）

### 3) `src/pages/auth/LineCallback.tsx`
- `intent=signup` を考慮して遷移分岐
- 新規ユーザーは `register/profile`、既存は `mypage`
- 友だち未追加時のエラー導線は維持（再ログインボタン）

### 4) ルーティング (`src/App.tsx`)
- `/auth/register/add-friend` を「新規登録の正式入口」として定義整理
- 不要になった旧前提ロジック（lineProfile必須前提）を削減

### 5) LINE設定の確認（手動必須）
- LINE Loginチャネルで「Linked Bot」が正しく紐付いているか確認
- Callback URLに本番ドメインが正しく登録されているか確認
- 公式アカウントID（`@616jfxwh`）の表記ゆれ確認

---

## 期待される結果
- ユーザーが「新規登録」を押した直後に、必ず2枚目相当の友だち追加画面が表示される
- 1枚目（access.line.meログイン画面）は「次へ」を押した後にのみ出る（本人確認ステップとして後段化）
- 「なんでこの画面？」という違和感を解消し、要件の順序に一致

---

## 検証計画（実装後）
1. 新規登録導線: `/auth/login` → 新規登録 → 友だち追加画面表示確認  
2. 友だち追加完了後: 次へ → OAuth → callback → profile遷移確認  
3. 既存ユーザー: OAuth後に`/mypage`遷移確認  
4. 外部ブラウザ（Gmail/Safari）起点でも、最初に2枚目相当画面が出ることを確認  
5. 友だち未追加時にブロックUIが正常表示されることを確認
